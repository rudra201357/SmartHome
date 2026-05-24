const BASE_URL = 'https://api.rainmaker.espressif.com';

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data.description || data.status || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function loginRainMaker(email, password) {
  const response = await fetch(`${BASE_URL}/v1/login2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_name: email,
      password,
    }),
  });

  const data = await parseResponse(response);
  const accessToken = data.accesstoken || data.access_token;

  if (!accessToken) {
    throw new Error(data.description || 'Login failed. Access token was not returned.');
  }

  return accessToken;
}

export async function fetchUserNodes(accessToken) {
  const nodes = [];
  let startId = '';

  do {
    const query = new URLSearchParams({
      node_details: 'true',
      status: 'true',
      config: 'true',
      params: 'true',
      num_records: '100',
    });

    if (startId) {
      query.set('start_id', startId);
    }

    const response = await fetch(`${BASE_URL}/v1/user/nodes?${query.toString()}`, {
      headers: {
        Authorization: accessToken,
      },
    });

    const data = await parseResponse(response);
    nodes.push(...normalizeNodes(data));
    startId = data.next_id || '';
  } while (startId);

  return nodes;
}

export async function updateNodeParam(accessToken, nodeId, deviceName, paramName, value) {
  const payload = {
    [deviceName]: {
      [paramName]: value,
    },
  };

  const response = await fetch(
    `${BASE_URL}/v1/user/nodes/params?node_id=${encodeURIComponent(nodeId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}

function normalizeNodes(data) {
  if (Array.isArray(data.node_details)) {
    return data.node_details.map((node) => ({
      ...node,
      id: getNodeId(node),
    }));
  }

  if (data.node_details && typeof data.node_details === 'object') {
    return Object.entries(data.node_details).map(([id, details]) => ({
      ...details,
      id: getNodeId(details) || id,
    }));
  }

  if (Array.isArray(data.nodes)) {
    return data.nodes.map((id) => ({ id }));
  }

  return [];
}

function getNodeId(node) {
  return node?.id || node?.node_id || node?.config?.node_id || '';
}
