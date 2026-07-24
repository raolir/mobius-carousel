<?php
/**
 * Server-side render callback for the Möbius Carousel block.
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$category_id =
	isset( $attributes['categoryId'] ) && is_int( $attributes['categoryId'] )
		? absint( $attributes['categoryId'] )
		: 0;

$visible_card_count =
	isset( $attributes['visibleCardCount'] ) &&
	is_int( $attributes['visibleCardCount'] ) &&
	$attributes['visibleCardCount'] > 0
		? $attributes['visibleCardCount']
		: 7;

$background_color = isset( $attributes['backgroundColor'] ) && is_string( $attributes['backgroundColor'] )
	? sanitize_hex_color( $attributes['backgroundColor'] )
	: null;
$background_color = $background_color ?: '#667889';

$items = mobius_carousel_get_items_for_category( $category_id );
$payload = array(
	'items'            => $items,
	'visibleCardCount' => $visible_card_count,
	'backgroundColor'  => $background_color,
);

$json = wp_json_encode(
	$payload,
	JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);

if ( false === $json ) {
	$json = '{"items":[],"visibleCardCount":7,"backgroundColor":"#667889"}';
}

$instance_id = wp_unique_id( 'mobius-carousel-' );
$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'id'                   => $instance_id,
		'class'                => 'mobius-carousel-host',
		'data-mobius-carousel' => 'true',
		'style'                => sprintf( 'background-color:%s;', $background_color ),
	)
);

mobius_carousel_enqueue_frontend_assets();

printf(
	'<div %1$s><script type="application/json">%2$s</script></div>',
	$wrapper_attributes,
	$json
);
