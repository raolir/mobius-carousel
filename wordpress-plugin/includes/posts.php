<?php
/**
 * Post querying and normalization for carousel payloads.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Retrieve normalized carousel items for one exact category.
 *
 * Sticky posts are returned first. Each group is ordered by publication date
 * and post ID in descending order.
 *
 * @return array<int, array<string, mixed>>
 */
function mobius_carousel_get_items_for_category( int $category_id ): array {
	if ( $category_id <= 0 || ! term_exists( $category_id, 'category' ) ) {
		return array();
	}

	$sticky_ids = array_values(
		array_filter(
			array_map( 'absint', (array) get_option( 'sticky_posts', array() ) )
		)
	);
	$posts = array();

	if ( $sticky_ids ) {
		$sticky_query = new WP_Query(
			mobius_carousel_post_query_args(
				$category_id,
				array(
					'post__in' => $sticky_ids,
				)
			)
		);
		$posts = $sticky_query->posts;
	}

	$regular_overrides = $sticky_ids
		? array(
			'post__not_in' => $sticky_ids,
		)
		: array();
	$regular_query = new WP_Query(
		mobius_carousel_post_query_args( $category_id, $regular_overrides )
	);

	$posts = array_merge( $posts, $regular_query->posts );

	return array_map( 'mobius_carousel_normalize_post', $posts );
}

/**
 * Build the explicit shared arguments for carousel post queries.
 *
 * @param array<string, mixed> $overrides Query-specific arguments.
 * @return array<string, mixed>
 */
function mobius_carousel_post_query_args( int $category_id, array $overrides = array() ): array {
	$args = array(
		'post_type'              => 'post',
		'post_status'            => 'publish',
		'posts_per_page'         => -1,
		'ignore_sticky_posts'    => true,
		'no_found_rows'          => true,
		'update_post_meta_cache' => true,
		'update_post_term_cache' => true,
		'orderby'                => array(
			'date' => 'DESC',
			'ID'   => 'DESC',
		),
		'tax_query'              => array(
			array(
				'taxonomy'         => 'category',
				'field'            => 'term_id',
				'terms'            => array( $category_id ),
				'include_children' => false,
			),
		),
	);

	return array_merge( $args, $overrides );
}

/**
 * Convert a WordPress post into the public CarouselItem shape.
 *
 * @return array<string, mixed>
 */
function mobius_carousel_normalize_post( WP_Post $post ): array {
	$image_url = get_the_post_thumbnail_url( $post, 'large' );
	$image_url = is_string( $image_url ) ? esc_url_raw( $image_url ) : '';

	$tag_names = wp_get_post_tags(
		$post->ID,
		array(
			'fields' => 'names',
		)
	);

	if ( is_wp_error( $tag_names ) ) {
		$tag_names = array();
	}

	return array(
		'id'             => (int) $post->ID,
		'title'          => wp_strip_all_tags( get_the_title( $post ) ),
		'imageUrl'       => $image_url ?: null,
		'description'    => wp_strip_all_tags( get_the_excerpt( $post ) ),
		'tags'           => array_values( array_map( 'strval', $tag_names ) ),
		'destinationUrl' => mobius_carousel_normalize_destination_url(
			get_post_meta( $post->ID, 'destination_url', true )
		),
	);
}

/**
 * Validate and sanitize a native destination_url custom field value.
 */
function mobius_carousel_normalize_destination_url( mixed $value ): ?string {
	if ( ! is_string( $value ) ) {
		return null;
	}

	$value = trim( $value );

	if ( '' === $value ) {
		return null;
	}

	$url = esc_url_raw( $value, array( 'http', 'https' ) );

	if ( ! $url || false === filter_var( $url, FILTER_VALIDATE_URL ) ) {
		return null;
	}

	$scheme = wp_parse_url( $url, PHP_URL_SCHEME );

	return in_array( $scheme, array( 'http', 'https' ), true ) ? $url : null;
}
