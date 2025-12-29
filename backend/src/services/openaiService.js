import { openai } from '../config/openai.js';

/**
 * Extract structured data from COA PDF using GPT-4 Vision
 * @param {Array<string>} base64Images - Array of base64 encoded PDF page images
 * @returns {Promise<Object>} Extracted and structured data
 */
export async function extractDataWithGPTVision(base64Images) {
  try {
    console.log(`Sending ${base64Images.length} images to GPT-4 Vision...`);

    // Prepare image content for GPT-4 Vision
    const imageContents = base64Images.map(base64 => ({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
        detail: 'high', // High detail for better text extraction
      },
    }));

    const systemPrompt = `You are an expert at extracting structured data from Certificate of Analysis (COA) documents. 
Your task is to carefully read ALL PAGES of the COA and extract ALL relevant information into a structured JSON format.

IMPORTANT: This may be a MULTI-PAGE document. You MUST analyze ALL provided images/pages and combine the data from all pages into a single cohesive response.

Pay special attention to:
- Product name and identifiers (usually on first page)
- Batch/Lot numbers
- Chemical information (CAS numbers, formulas)
- Test specifications and results in tabular format (may span multiple pages)
- Dates and manufacturer information
- Quality parameters
- Continuation of tables from previous pages

Return ONLY valid JSON without any markdown formatting or additional text.`;

    const userPrompt = `Extract ALL data from this Certificate of Analysis (COA) document. This may be a MULTI-PAGE document - analyze ALL ${base64Images.length} page(s) provided and combine all information.

Return structured JSON with the following schema:

{
  "productName": "Full product name",
  "batchNo": "Batch number",
  "lotNo": "Lot number",
  "casNo": "CAS number",
  "date": "Date of analysis or manufacture",
  "expiryDate": "Expiry date if present",
  "purity": "Purity percentage",
  "appearance": "Physical appearance description",
  "supplier": "Manufacturer or supplier name",
  "supplierAddress": "Full supplier address",
  "specifications": [
    {
      "parameter": "Test parameter name",
      "specification": "Specification/standard value",
      "result": "Actual test result"
    }
  ],
  "additionalInfo": {
    "molecularFormula": "Chemical formula if present",
    "molecularWeight": "Molecular weight if present",
    "storage": "Storage conditions",
    "packaging": "Packaging information",
    "conclusion": "Overall conclusion or remarks"
  }
}

CRITICAL INSTRUCTIONS:
1. Extract ALL visible specifications from the test results table across ALL pages
2. If a table continues on the next page, combine all rows into a single specifications array
3. Do not skip any rows or pages
4. If a field is not present in the document, use null
5. Ensure numbers and percentages are captured exactly as shown
6. If there are ${base64Images.length} pages, make sure you extract data from ALL of them`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest GPT-4 with vision
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...imageContents,
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const extractedData = JSON.parse(response.choices[0].message.content);
    
    console.log('✅ Successfully extracted data with GPT-4 Vision');
    console.log('Product:', extractedData.productName);
    console.log('Specifications:', extractedData.specifications?.length || 0);

    // Calculate approximate cost
    const promptTokens = response.usage.prompt_tokens;
    const completionTokens = response.usage.completion_tokens;
    const estimatedCost = (promptTokens * 0.00001) + (completionTokens * 0.00003);
    
    return {
      ...extractedData,
      _metadata: {
        model: 'gpt-4o',
        tokensUsed: response.usage.total_tokens,
        estimatedCost: estimatedCost.toFixed(4),
      },
    };
  } catch (error) {
    console.error('Error in GPT-4 Vision extraction:', error);
    throw new Error(`GPT-4 Vision extraction failed: ${error.message}`);
  }
}

/**
 * Extract structured data from text-based PDF using GPT-4 Turbo (cheaper and faster)
 * @param {string} text - Extracted text from PDF
 * @returns {Promise<Object>} Extracted and structured data
 */
export async function extractDataWithGPT4Text(text) {
  try {
    console.log('📝 Sending text to GPT-4 Turbo for extraction...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured data from Certificate of Analysis (COA) documents.',
        },
        {
          role: 'user',
          content: `Extract ALL data from this COA document text and return as JSON with this schema:

{
  "productName": "string",
  "batchNo": "string",
  "lotNo": "string",
  "casNo": "string",
  "date": "string",
  "purity": "string",
  "appearance": "string",
  "supplier": "string",
  "specifications": [
    {
      "parameter": "string",
      "specification": "string",
      "result": "string"
    }
  ]
}

COA Text:
${text}

Return ONLY valid JSON. Extract ALL specifications from the test results table. Do not skip any rows.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const extractedData = JSON.parse(response.choices[0].message.content);
    
    // Calculate approximate cost
    const promptTokens = response.usage.prompt_tokens;
    const completionTokens = response.usage.completion_tokens;
    const estimatedCost = (promptTokens * 0.00001) + (completionTokens * 0.00003);
    
    console.log('✅ Successfully extracted data with GPT-4 Turbo');
    console.log(`💰 Cost: ~$${estimatedCost.toFixed(4)} (${response.usage.total_tokens} tokens)`);

    return {
      ...extractedData,
      _metadata: {
        model: 'gpt-4-turbo',
        tokensUsed: response.usage.total_tokens,
        estimatedCost: estimatedCost.toFixed(4),
        method: 'text-extraction',
      },
    };
  } catch (error) {
    console.error('Error in GPT-4 text extraction:', error);
    throw new Error(`GPT-4 text extraction failed: ${error.message}`);
  }
}

