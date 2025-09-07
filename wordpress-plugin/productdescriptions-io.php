<?php
/**
 * Plugin Name: ProductDescriptions.io - AI Product Descriptions
 * Plugin URI: https://productdescriptions.io
 * Description: Generate AI-powered product descriptions for WooCommerce products
 * Version: 1.0.0
 * Author: ProductDescriptions.io
 * Author URI: https://productdescriptions.io
 * License: GPL v2 or later
 * Text Domain: productdescriptions-io
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * WC requires at least: 4.0
 * WC tested up to: 8.5
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PDIO_VERSION', '1.0.0');
define('PDIO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PDIO_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('PDIO_API_URL', 'https://productdescriptions.io/api/v1');

// Check if WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    add_action('admin_notices', 'pdio_woocommerce_missing_notice');
    return;
}

function pdio_woocommerce_missing_notice() {
    ?>
    <div class="error">
        <p><?php _e('ProductDescriptions.io requires WooCommerce to be installed and active.', 'productdescriptions-io'); ?></p>
    </div>
    <?php
}

// Include required files
require_once PDIO_PLUGIN_PATH . 'includes/class-pdio-api.php';
require_once PDIO_PLUGIN_PATH . 'includes/class-pdio-admin.php';
require_once PDIO_PLUGIN_PATH . 'includes/class-pdio-generator.php';
require_once PDIO_PLUGIN_PATH . 'includes/class-pdio-bulk.php';
require_once PDIO_PLUGIN_PATH . 'includes/class-pdio-settings.php';

// Initialize plugin
class ProductDescriptionsIO {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Initialize components
        add_action('init', array($this, 'init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // Add plugin action links
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_action_links'));
    }
    
    public function init() {
        // Initialize API handler
        PDIO_API::get_instance();
        
        // Initialize admin interface
        if (is_admin()) {
            PDIO_Admin::get_instance();
            PDIO_Settings::get_instance();
            PDIO_Bulk::get_instance();
        }
        
        // Initialize generator
        PDIO_Generator::get_instance();
    }
    
    public function enqueue_admin_assets($hook) {
        // Only load on our plugin pages and WooCommerce product pages
        if (strpos($hook, 'productdescriptions-io') !== false || 
            $hook === 'post.php' || $hook === 'post-new.php') {
            
            wp_enqueue_style(
                'pdio-admin',
                PDIO_PLUGIN_URL . 'assets/css/admin.css',
                array(),
                PDIO_VERSION
            );
            
            wp_enqueue_script(
                'pdio-admin',
                PDIO_PLUGIN_URL . 'assets/js/admin.js',
                array('jquery'),
                PDIO_VERSION,
                true
            );
            
            wp_localize_script('pdio-admin', 'pdio_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('pdio_ajax_nonce'),
                'api_key' => get_option('pdio_api_key'),
                'generating_text' => __('Generating...', 'productdescriptions-io'),
                'success_text' => __('Description generated!', 'productdescriptions-io'),
                'error_text' => __('Error generating description', 'productdescriptions-io')
            ));
        }
    }
    
    public function add_action_links($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=productdescriptions-io-settings') . '">' . 
                        __('Settings', 'productdescriptions-io') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
    
    public function activate() {
        // Create database tables if needed
        $this->create_tables();
        
        // Set default options
        add_option('pdio_api_key', '');
        add_option('pdio_auto_generate', 'no');
        add_option('pdio_default_tone', 'professional');
        add_option('pdio_generate_images', 'yes');
        add_option('pdio_usage_stats', array(
            'descriptions_generated' => 0,
            'images_generated' => 0,
            'last_reset' => current_time('mysql')
        ));
        
        // Schedule cron for usage reset
        if (!wp_next_scheduled('pdio_reset_usage')) {
            wp_schedule_event(time(), 'monthly', 'pdio_reset_usage');
        }
    }
    
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('pdio_reset_usage');
    }
    
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        $table_name = $wpdb->prefix . 'pdio_generation_log';
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_id bigint(20) NOT NULL,
            generated_at datetime DEFAULT CURRENT_TIMESTAMP,
            description_count int(11) DEFAULT 1,
            image_count int(11) DEFAULT 0,
            status varchar(20) DEFAULT 'success',
            PRIMARY KEY (id),
            KEY product_id (product_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

// Initialize the plugin
ProductDescriptionsIO::get_instance();