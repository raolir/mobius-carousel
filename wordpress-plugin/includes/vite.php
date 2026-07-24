<?php
/**
 * Vite manifest integration for public and editor assets.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Read and cache the generated Vite manifest.
 *
 * @return array<string, mixed>|null
 */
function mobius_carousel_get_vite_manifest(): ?array {
	static $loaded = false;
	static $manifest = null;

	if ( $loaded ) {
		return $manifest;
	}

	$loaded = true;
	$manifest_path = MOBIUS_CAROUSEL_PLUGIN_DIR . 'dist/manifest.json';

	if ( ! is_readable( $manifest_path ) ) {
		return null;
	}

	$contents = file_get_contents( $manifest_path );

	if ( false === $contents ) {
		return null;
	}

	try {
		$decoded = json_decode( $contents, true, 512, JSON_THROW_ON_ERROR );
	} catch ( JsonException ) {
		return null;
	}

	if ( ! is_array( $decoded ) ) {
		return null;
	}

	$manifest = $decoded;

	return $manifest;
}

/**
 * Resolve one generated manifest entry.
 *
 * @return array<string, mixed>|null
 */
function mobius_carousel_get_vite_entry( string $entry_key ): ?array {
	$manifest = mobius_carousel_get_vite_manifest();

	if ( ! $manifest || ! isset( $manifest[ $entry_key ] ) || ! is_array( $manifest[ $entry_key ] ) ) {
		return null;
	}

	$entry = $manifest[ $entry_key ];

	return isset( $entry['file'] ) && is_string( $entry['file'] ) ? $entry : null;
}

/**
 * Resolve a manifest-relative generated asset.
 *
 * @return array{path: string, url: string}|null
 */
function mobius_carousel_get_vite_asset( string $relative_path ): ?array {
	$relative_path = ltrim( $relative_path, '/' );

	if ( '' === $relative_path || str_contains( $relative_path, '..' ) ) {
		return null;
	}

	$path = MOBIUS_CAROUSEL_PLUGIN_DIR . 'dist/' . $relative_path;

	if ( ! is_file( $path ) ) {
		return null;
	}

	return array(
		'path' => $path,
		'url'  => plugins_url( 'dist/' . $relative_path, MOBIUS_CAROUSEL_PLUGIN_FILE ),
	);
}

/**
 * Register one Vite JavaScript entry and its directly imported styles.
 *
 * @return array{module: string, styles: string[]}|null
 */
function mobius_carousel_register_vite_entry( string $entry_key, string $handle ): ?array {
	static $registered = array();

	if ( array_key_exists( $handle, $registered ) ) {
		return $registered[ $handle ];
	}

	$entry = mobius_carousel_get_vite_entry( $entry_key );

	if ( ! $entry ) {
		$registered[ $handle ] = null;
		return null;
	}

	$script = mobius_carousel_get_vite_asset( $entry['file'] );

	if ( ! $script ) {
		$registered[ $handle ] = null;
		return null;
	}

	$script_version = filemtime( $script['path'] );
	wp_register_script_module(
		$handle,
		$script['url'],
		array(),
		false === $script_version ? MOBIUS_CAROUSEL_VERSION : (string) $script_version
	);

	$style_handles = array();
	$styles = isset( $entry['css'] ) && is_array( $entry['css'] ) ? $entry['css'] : array();

	foreach ( $styles as $index => $style_path ) {
		if ( ! is_string( $style_path ) ) {
			continue;
		}

		$style = mobius_carousel_get_vite_asset( $style_path );

		if ( ! $style ) {
			continue;
		}

		$style_handle = 0 === $index ? $handle . '-style' : $handle . '-style-' . $index;
		$style_version = filemtime( $style['path'] );

		wp_register_style(
			$style_handle,
			$style['url'],
			array(),
			false === $style_version ? MOBIUS_CAROUSEL_VERSION : (string) $style_version
		);
		$style_handles[] = $style_handle;
	}

	$registered[ $handle ] = array(
		'module' => $handle,
		'styles' => $style_handles,
	);

	return $registered[ $handle ];
}

/**
 * Enqueue public assets only when a carousel block is rendered.
 */
function mobius_carousel_enqueue_frontend_assets(): bool {
	$assets = mobius_carousel_register_vite_entry(
		'src/frontend/main.tsx',
		'mobius-carousel-frontend'
	);

	if ( ! $assets ) {
		return false;
	}

	wp_enqueue_script_module( $assets['module'] );

	foreach ( $assets['styles'] as $style_handle ) {
		wp_enqueue_style( $style_handle );
	}

	return true;
}

/**
 * Enqueue the minimal block registration entry in block-editor contexts.
 */
function mobius_carousel_enqueue_editor_assets(): void {
	$assets = mobius_carousel_register_vite_entry(
		'src/editor/index.tsx',
		'mobius-carousel-editor'
	);

	if ( ! $assets ) {
		return;
	}

	$wordpress_dependencies = array(
		'wp-blocks',
		'wp-block-editor',
		'wp-components',
		'wp-core-data',
		'wp-data',
		'wp-element',
		'wp-i18n',
	);

	foreach ( $wordpress_dependencies as $dependency ) {
		wp_enqueue_script( $dependency );
	}

	wp_enqueue_script_module( $assets['module'] );

	foreach ( $assets['styles'] as $style_handle ) {
		wp_enqueue_style( $style_handle );
	}
}
