<?php
/**
 * Plugin Name:       Möbius Carousel
 * Description:       Displays published posts as an interactive Möbius-strip carousel.
 * Version:           0.1.0
 * Requires at least: 7.0
 * Requires PHP:      8.2
 * Text Domain:       mobius-carousel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MOBIUS_CAROUSEL_VERSION', '0.1.0' );
define( 'MOBIUS_CAROUSEL_PLUGIN_FILE', __FILE__ );
define( 'MOBIUS_CAROUSEL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

require_once MOBIUS_CAROUSEL_PLUGIN_DIR . 'includes/posts.php';
require_once MOBIUS_CAROUSEL_PLUGIN_DIR . 'includes/vite.php';

function mobius_carousel_register_block(): void {
	register_block_type( MOBIUS_CAROUSEL_PLUGIN_DIR . 'block' );
}

add_action( 'init', 'mobius_carousel_register_block' );
add_action( 'enqueue_block_editor_assets', 'mobius_carousel_enqueue_editor_assets' );
