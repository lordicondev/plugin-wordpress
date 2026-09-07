<?php
/**
 * Plugin Name: Lordicon
 * Plugin URI: https://lordicon.com/wordpress-plugin
 * Description: Insert and customize interactive, animated icons.
 * Version: 1.1.0
 * Author: Lordicon
 * Author URI: https://lordicon.com/
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 6.7
 * Requires PHP: 7.4
 * Text Domain: lordicon
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

require plugin_dir_path( __FILE__ ) . 'includes/class-plugin.php';

function lordicon_run_plugin() {
	$plugin = new \Lordicon\Plugin();
	$plugin->run();
}

lordicon_run_plugin();
