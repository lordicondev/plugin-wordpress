<?php
/**
 * Plugin Name: Lordicon
 * Plugin URI: https://lordicon.com/wordpress-plugin
 * Description: Insert and customize interactive, animated icons.
 * Version: 1.0
 * Author: Lordicon
 * Author URI: https://lordicon.com/
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: lordicon
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

require plugin_dir_path( __FILE__ ) . 'includes/class-plugin.php';

function run_lordicon_plugin() {
	$plugin = new \Lordicon\Plugin();
	$plugin->run();
}

run_lordicon_plugin();
