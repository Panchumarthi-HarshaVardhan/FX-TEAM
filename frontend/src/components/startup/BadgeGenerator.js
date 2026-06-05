'use client';

import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

export default function BadgeGenerator({ startupId, slug }) {
  const [copied, setCopied] = useState(false);
  
  // Assuming API URL from env or constant
  const apiUrl = 'http://localhost:3000'; 
  const badgeUrl = `${apiUrl}/api/startups/${startupId}/badge`;
  const linkUrl = `http://localhost:3000/s/${slug}`; // Frontend URL

  const embedCode = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="Built on FounderX" width="200" height="60" /></a>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Code className="h-5 w-5 text-gray-400" />
        Built on FounderX Badge
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        Add this badge to your website footer to show you’re part of the FounderX community. We track clicks and views!
      </p>

      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Preview */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">Preview</span>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <img src={badgeUrl} alt="Badge Preview" />
          </div>
        </div>

        {/* Code Snippet */}
        <div className="flex-1 w-full">
          <div className="relative">
            <textarea
              readOnly
              value={embedCode}
              className="w-full h-24 p-3 pr-12 bg-gray-900 text-gray-300 font-mono text-xs rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition text-white"
              title="Copy Code"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Copy and paste this HTML code into your website’s footer.
          </p>
        </div>
      </div>
    </div>
  );
}
