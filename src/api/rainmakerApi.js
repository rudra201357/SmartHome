import { assertAutomationPayload } from '../utils/automationHelpers';

const BASE_URL = 'https://api.rainmaker.espressif.com';

async function parseResponse(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { description: text };
    }
  }

  if (!response.ok) {
    const message = data.description || data.status || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data.error_code || data.code;
    error.data = data;
    throw error;
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
      metadata: 'true',
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

  return Promise.all(
    nodes.map(async (node) => {
      const nodeId = getNodeId(node);

      if (!nodeId) {
        return node;
      }

      try {
        const params = await fetchNodeParams(accessToken, nodeId);

        return {
          ...node,
          params: {
            ...(node.params || {}),
            ...(params || {}),
          },
        };
      } catch (error) {
        return node;
      }
    }),
  );
}

export async function fetchNodeParams(accessToken, nodeId) {
  const response = await fetch(
    `${BASE_URL}/v1/user/nodes/params?node_id=${encodeURIComponent(nodeId)}`,
    {
      headers: {
        Authorization: accessToken,
      },
    },
  );

  const data = await parseResponse(response);
  return data.params || data;
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



export async function fetchUserAutomations(accessToken, nodeIds = []) {
  const automations = [];
  const seenIds = new Set();
  const queries = [
    {},
    ...nodeIds.filter(Boolean).map((nodeId) => ({ node_id: nodeId })),
  ];

  for (const extraQuery of queries) {
    try {
      const nextAutomations = await fetchAutomationQuery(accessToken, extraQuery);

      nextAutomations.forEach((automation) => {
        const id =
          automation?.automation_id ||
          automation?.trigger_id ||
          automation?.id ||
          JSON.stringify(automation);

        if (seenIds.has(id)) {
          return;
        }

        seenIds.add(id);
        automations.push({ ...automation, id });
      });
    } catch (error) {
      // Failed silently
    }
  }

  return automations;
}

async function fetchAutomationQuery(accessToken, extraQuery = {}) {
  const automations = [];
  let startId = '';

  do {
    const query = new URLSearchParams({
      num_records: '100',
    });

    Object.entries(extraQuery).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      }
    });

    if (startId) {
      query.set('start_id', startId);
    }

    const url = `${BASE_URL}/v1/user/node_automation?${query.toString()}`;

    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: accessToken,
        },
      });
    } catch (fetchErr) {
      throw fetchErr;
    }

    let data;
    try {
      data = await parseResponse(response);
    } catch (error) {
      if (isNoAutomationError(error)) {
        break;
      }

      throw error;
    }

    const normalized = normalizeAutomations(data);
    automations.push(...normalized);
    startId = data.next_id || '';
  } while (startId);

  return automations;
}

export async function createNodeAutomation(accessToken, automation) {
  assertAutomationPayload(automation);

  const payload = {
    name: automation.name,
    node_id: automation.trigger.nodeId,
    event_type: 'node_params',
    events: [
      {
        params: {
          [automation.trigger.deviceName]: {
            [automation.trigger.paramName]: automation.trigger.value,
          },
        },
        check: '==',
      },
    ],
    event_operator: 'and',
    actions: [
      {
        node_id: automation.action.nodeId,
        params: {
          [automation.action.deviceName]: {
            [automation.action.paramName]: automation.action.value,
          },
        },
      },
    ],
    retrigger: false,
    enabled: true,
    metadata: {
      source: 'My SmartHome',
    },
  };

  const response = await fetch(`${BASE_URL}/v1/user/node_automation`, {
    method: 'POST',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteNodeAutomation(accessToken, automationId) {
  const response = await fetch(
    `${BASE_URL}/v1/user/node_automation?automation_id=${encodeURIComponent(automationId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: accessToken,
      },
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

function normalizeAutomations(data) {
  const candidates = [
    data?.automation_trigger_actions,
    data?.node_automations,
    data?.node_automation,
    data?.automation_triggers,
    data?.automation_trigger,
    data?.automations,
    data?.automation,
    data?.automation_details,
    data?.automation_detail,
    data?.triggers,
    data?.items,
    data?.records,
    data?.results,
    data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object' && candidate !== data) {
      const nested = normalizeAutomations(candidate);

      if (nested.length) {
        return nested;
      }
    }
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data?.automation_id || data?.trigger_id) {
    return [data];
  }

  if (data && typeof data === 'object') {
    const values = Object.values(data).filter(
      (value) => value && typeof value === 'object' && (value.automation_id || value.trigger_id || value.events),
    );

    if (values.length) {
      return values;
    }
  }

  return [];
}

function isNoAutomationError(error) {
  const code = String(error?.code || error?.data?.error_code || '');

  return (
    code === '127016' ||
    /no automation/i.test(error?.message || '')
  );
}
