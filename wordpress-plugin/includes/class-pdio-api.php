<?php
/**
 * API Handler for ProductDescriptions.io
 */

if (!defined('ABSPATH')) {
    exit;
}

class PDIO_API {
    
    private static $instance = null;
    private $api_key;
    private $api_url;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->api_key = get_option('pdio_api_key');
        $this->api_url = PDIO_API_URL;
    }
    
    /**
     * Generate product description via API
     */
    public function generate_description($product_data) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('API key not configured', 'productdescriptions-io'));
        }
        
        $endpoint = $this->api_url . '/generate';
        
        $body = array(
            'productName' => $product_data['name'],
            'productCategory' => $product_data['category'],
            'keyFeatures' => $product_data['features'],
            'targetAudience' => $product_data['target_audience'],
            'tone' => $product_data['tone'] ?? get_option('pdio_default_tone', 'professional'),
            'generateImages' => $product_data['generate_images'] ?? (get_option('pdio_generate_images') === 'yes'),
            'platform' => 'woocommerce'
        );
        
        $response = wp_remote_post($endpoint, array(
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->api_key
            ),
            'body' => json_encode($body)
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($code !== 200) {
            $error_message = isset($data['error']) ? $data['error'] : __('API request failed', 'productdescriptions-io');
            return new WP_Error('api_error', $error_message);
        }
        
        return $data;
    }
    
    /**
     * Analyze product image
     */
    public function analyze_image($image_url) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('API key not configured', 'productdescriptions-io'));
        }
        
        // Download image and convert to base64
        $image_data = $this->get_image_base64($image_url);
        if (is_wp_error($image_data)) {
            return $image_data;
        }
        
        $endpoint = $this->api_url . '/analyze';
        
        $response = wp_remote_post($endpoint, array(
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->api_key
            ),
            'body' => json_encode(array(
                'imageBase64' => $image_data
            ))
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($code !== 200) {
            return new WP_Error('api_error', __('Image analysis failed', 'productdescriptions-io'));
        }
        
        return $data;
    }
    
    /**
     * Get usage statistics
     */
    public function get_usage() {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('API key not configured', 'productdescriptions-io'));
        }
        
        $endpoint = $this->api_url . '/usage';
        
        $response = wp_remote_get($endpoint, array(
            'timeout' => 10,
            'headers' => array(
                'X-API-Key' => $this->api_key
            )
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($code !== 200) {
            return new WP_Error('api_error', __('Failed to get usage data', 'productdescriptions-io'));
        }
        
        return $data;
    }
    
    /**
     * Convert image URL to base64
     */
    private function get_image_base64($image_url) {
        $response = wp_remote_get($image_url, array('timeout' => 15));
        
        if (is_wp_error($response)) {
            return new WP_Error('image_download_failed', __('Failed to download image', 'productdescriptions-io'));
        }
        
        $image_data = wp_remote_retrieve_body($response);
        $mime_type = wp_remote_retrieve_header($response, 'content-type');
        
        if (empty($image_data)) {
            return new WP_Error('image_empty', __('Image is empty', 'productdescriptions-io'));
        }
        
        return 'data:' . $mime_type . ';base64,' . base64_encode($image_data);
    }
    
    /**
     * Validate API key
     */
    public function validate_api_key($api_key = null) {
        $key = $api_key ?? $this->api_key;
        
        if (empty($key)) {
            return false;
        }
        
        $endpoint = $this->api_url . '/validate';
        
        $response = wp_remote_get($endpoint, array(
            'timeout' => 10,
            'headers' => array(
                'X-API-Key' => $key
            )
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        return $code === 200;
    }
}