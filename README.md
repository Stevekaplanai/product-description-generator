# AI-Powered Product Description & UGC Video Generator

An advanced platform for generating SEO-optimized product descriptions, AI-generated product images, and authentic UGC-style video demonstrations at scale.

## 🚀 Features

### Core Capabilities
- **AI Product Descriptions**: Generate multiple SEO-optimized variations using Google Gemini
- **AI Image Generation**: Create professional product images with DALL-E 3
- **UGC Video Creation**: Generate authentic product demonstration videos with AI avatars
- **Hybrid Video Composition**: Combine avatar videos with product images
- **Bulk Processing**: CSV upload for batch product content generation
- **Cloud Storage**: Automatic upload to Cloudinary CDN

### Video Generation Features
- **D-ID Integration**: AI-powered talking avatars for product pitches
- **Multiple Video Styles**:
  - Split-screen (avatar + product images)
  - Picture-in-Picture overlay
  - Product slideshow with narration
- **Authentic UGC Scripts**: Natural product pitches without false claims
- **FFmpeg Video Processing**: Professional video composition and editing

## 📋 Prerequisites

- Node.js 18+ 
- FFmpeg (automatically installed via npm)
- API Keys for:
  - OpenAI (DALL-E 3)
  - Google Gemini
  - Cloudinary
  - D-ID (for video generation)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd product-description-generator
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```env
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
D_ID_API_KEY=your_did_key
PORT=3000
```

## 🚦 Quick Start

1. Start the server:
```bash
npm start
```

2. Open your browser:
```
http://localhost:3000
```

3. Generate your first product:
   - Enter product details
   - Select description variations
   - Choose image styles
   - Enable video generation (optional)
   - Click "Generate"

## 📁 Project Structure

```
product-description-generator/
├── src/                    # Source code
│   └── video-composer.js   # Video composition module
├── tests/                  # Test files
│   ├── test-cloudinary-video-upload.js
│   ├── test-video-generation.js
│   └── test-hybrid-ugc-video.js
├── public/                 # Static files and uploads
│   ├── uploads/           # Uploaded files
│   ├── generated-images/  # AI-generated images
│   └── generated-videos/  # Generated videos
├── config/                # Configuration files
├── docs/                  # Documentation
├── server.js             # Main server file
├── index.html            # Frontend interface
├── package.json          # Dependencies
└── .env                  # Environment variables
```

## 🎥 Video Generation

### Basic UGC Video
```javascript
POST /api/generate-video
{
  "productName": "Smart Watch",
  "productDescription": "Advanced fitness tracker",
  "features": "Heart rate, GPS, Waterproof",
  "avatar": "sophia",
  "language": "en-US"
}
```

### Hybrid Product Showcase
```javascript
POST /api/generate-video
{
  "productName": "Smart Watch",
  "generateProductShowcase": true,
  "images": [
    {"url": "image1.jpg"},
    {"url": "image2.jpg"}
  ]
}
```

## 🔧 API Endpoints

### Product Generation
- `POST /api/generate` - Generate product descriptions and images
- `POST /api/analyze-image` - Analyze uploaded product images
- `POST /api/upload-csv` - Bulk generate from CSV

### Video Generation  
- `POST /api/generate-video` - Create UGC video
- `POST /api/webhook/d-id` - D-ID webhook callback

### Health Check
- `GET /api/health` - Server status

## 🎨 Customization

### Video Styles
Modify `src/video-composer.js` to customize:
- Split-screen layouts
- Overlay positions
- Transition effects
- Text overlays

### Script Templates
Edit script generation in `server.js`:
- Tone and personality
- Product pitch styles
- Call-to-action phrases

## 🚀 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
```

### Performance Optimization
- Enable Redis caching for API responses
- Use CDN for static assets
- Implement rate limiting
- Set up webhook queues for video processing

### Monitoring
- Track API usage and costs
- Monitor video generation success rates
- Log errors to external service

## 🔄 Future Integrations

### Planned: Arcads.ai Integration
Replace D-ID with Arcads.ai for more realistic UGC videos:
- 300+ diverse AI avatars
- Superior lipsync technology  
- Product demonstration capabilities

Request API access: r@arcads.ai

## 📊 API Usage & Limits

### D-ID Credits
- Each video generation uses 1 credit
- Monitor usage in D-ID dashboard
- Consider batch processing for efficiency

### Cloudinary Storage
- Free tier: 25GB storage
- Automatic image optimization
- Video transformation capabilities

## 🐛 Troubleshooting

### Common Issues

1. **Video URLs Expiring (403 Error)**
   - D-ID URLs expire after ~1 hour
   - Videos are automatically downloaded to Cloudinary

2. **FFmpeg Not Found**
   - Automatically installed via npm
   - Manual install: `npm install @ffmpeg-installer/ffmpeg`

3. **API Rate Limits**
   - Implement exponential backoff
   - Use webhook callbacks for async processing

## 📝 Testing

Run test scripts:
```bash
# Test video generation
node tests/test-video-generation.js

# Test hybrid UGC video
node tests/test-hybrid-ugc-video.js

# Test D-ID directly
node tests/test-did-direct.js
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions:
- Open GitHub issue
- Check documentation in `/docs`
- Review test files for examples

## 🎯 Roadmap

- [ ] Arcads.ai integration for realistic UGC
- [ ] A/B testing for generated content
- [ ] Analytics dashboard
- [ ] Multi-language support expansion
- [ ] Custom avatar training
- [ ] Real-time preview generation
- [ ] Shopify/WooCommerce plugins

---

Built with ❤️ for modern e-commerce content creation