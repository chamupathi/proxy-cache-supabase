// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { getCachedData, insertNewData, updateExpiredData, isDataExpired } from "./database.ts";
import { fetchData } from "./api.ts";

const generateRandomString = (length)=>{
  const buffer = randomBytes(length);
  return buffer.toString('hex');
};

const randomString = generateRandomString(10);
console.log(randomString);

const server = createServer(async (req, res)=>{
  // Parse the URL to get the path
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Get and log search parameters
  const searchParams = Object.fromEntries(url.searchParams.entries());
  console.log('Search parameters:', searchParams);
  
  // Split the path by "/" and filter out empty strings
  const pathArray = path.split('/').filter(segment => segment !== '');
  

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.end();
    return;
  }

  // Set response headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');


  try {

    const path = pathArray.slice(1).join('/');
    const key = path + '?' + Object.entries(searchParams).map(([key, value]) => `${key}=${value}`).join('&');

    // Get cached data from database
    const cachedData = await getCachedData(key);

    let freshData = null;

    // Check if data exists and is not expired
    const dataExpired = isDataExpired(cachedData);

    // Only call API if no data found in database or data is expired
    if (!cachedData || cachedData.length === 0 || dataExpired) {
      try {
        // Fetch data from API
        freshData = await fetchData(path, searchParams);

        if (dataExpired && cachedData && cachedData.length > 0) {
          // Update existing row with new data
          await updateExpiredData(key, freshData);
        } else {
          // Insert new data
          await insertNewData(key, freshData);
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        // If API call fails, keep existing data and don't update database
        freshData = null;
      }
    }
    
    // Return both the path array and the table data
    const response = {
      path: pathArray,
      searchParams,
      data: freshData || (cachedData && cachedData.length > 0 ? cachedData[0].data : null),
      fromCache: !freshData // true if data came from cache, false if from API
    };
    
    res.end(JSON.stringify(response));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(9999);
