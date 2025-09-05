import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple test endpoint to test file upload functionality
 * Returns an HTML form for manual testing
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testForm = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Upload Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        input[type="file"] {
            width: 100%;
            padding: 10px;
            border: 2px dashed #ddd;
            border-radius: 5px;
            background: #fafafa;
        }
        button {
            background: #007cba;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
        }
        button:hover {
            background: #005a87;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        #result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
            font-family: monospace;
            display: none;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .info {
            background: #e2f3ff;
            border: 1px solid #b8daff;
            color: #004085;
        }
        .upload-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 File Upload Test</h1>
        
        <div class="upload-info">
            <strong>Test Requirements:</strong>
            <ul>
                <li>Max file size: 5MB</li>
                <li>Allowed types: JPG, PNG</li>
                <li>Requires Cloudflare R2 credentials in .env.local</li>
            </ul>
        </div>

        <form id="uploadForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="file">Select Image File:</label>
                <input type="file" id="file" name="file" accept="image/jpeg,image/jpg,image/png" required>
            </div>
            
            <button type="submit" id="uploadBtn">Upload File</button>
        </form>

        <div id="result"></div>
    </div>

    <script>
        const form = document.getElementById('uploadForm');
        const result = document.getElementById('result');
        const uploadBtn = document.getElementById('uploadBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('file');
            const file = fileInput.files[0];
            
            if (!file) {
                showResult('Please select a file', 'error');
                return;
            }

            // Show uploading state
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';
            showResult('Uploading file...', 'info');

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    const resultText = \`✅ Upload Successful!

Session ID: \${data.data.sessionId}
File Key: \${data.data.fileKey}
Original Name: \${data.data.originalName}
File Size: \${(data.data.fileSize / 1024).toFixed(2)} KB
Content Type: \${data.data.contentType}
Uploaded At: \${data.data.uploadedAt}
File URL: \${data.data.fileUrl}

You can now use this sessionId for AI generation!\`;
                    showResult(resultText, 'success');
                } else {
                    showResult(\`❌ Upload Failed: \${data.error}\`, 'error');
                }
            } catch (error) {
                showResult(\`❌ Network Error: \${error.message}\`, 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload File';
            }
        });

        function showResult(message, type) {
            result.textContent = message;
            result.className = type;
            result.style.display = 'block';
        }
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(testForm);
}