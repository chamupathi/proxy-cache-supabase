export async function fetchData(path: string, searchParams: Record<string, string>) {
  const BASE_URL = 'https://xx.xx';
  const url = new URL(`${BASE_URL}/${path}`);

  const searchParamsArray = [
    { key: 'token', value: 'xx' },
    { key: 'app_id', value: 'xx' },
  ];

  searchParamsArray.push(...Object.entries(searchParams).map(([key, value]) => ({ key, value })));

  searchParamsArray.forEach(({ key, value }) => {
    url.searchParams.set(key, value);
  });

  console.log(url.toString());
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json;api_version=2'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
} 