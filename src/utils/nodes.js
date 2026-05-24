export function getNodeId(node) {
  return node?.id || node?.node_id || node?.config?.node_id || '';
}

export function getNodeName(node) {
  return node?.config?.info?.name || node?.name || getNodeId(node) || 'RainMaker Node';
}

export function isNodeOnline(node) {
  return Boolean(node?.status?.connectivity?.connected);
}

export function getNodeDevices(node) {
  const configDevices = Array.isArray(node?.config?.devices) ? node.config.devices : [];
  const paramDevices = Object.keys(node?.params || {}).map((name) => ({ name, params: [] }));

  return configDevices.length ? configDevices : paramDevices;
}

export function getDeviceParams(node, device) {
  const deviceName = device?.name;
  const reportedParams = node?.params?.[deviceName] || {};
  const configParams = Array.isArray(device?.params) ? device.params : [];

  if (configParams.length) {
    return configParams
      .filter((param) => param?.name)
      .map((param) => ({
        name: param.name,
        type: param.type || typeof reportedParams[param.name],
        value: reportedParams[param.name],
        primary: device.primary === param.name,
      }));
  }

  return Object.entries(reportedParams).map(([name, value]) => ({
    name,
    type: typeof value,
    value,
    primary: false,
  }));
}

export function getRelayControls(nodes) {
  return nodes.flatMap((node) => {
    const nodeId = getNodeId(node);
    const nodeName = getNodeName(node);
    const devices = getNodeDevices(node);

    return devices.flatMap((device) =>
      getDeviceParams(node, device)
        // Home only works with boolean relay-style parameters.
        .filter((param) => typeof param.value === 'boolean')
        .map((param) => ({
          key: `${nodeId}:${device.name}:${param.name}`,
          node,
          nodeId,
          nodeName,
          deviceName: device.name,
          paramName: param.name,
          value: param.value,
          defaultName: device.name || param.name || nodeName,
          online: isNodeOnline(node),
        })),
    );
  });
}

export function getNodeSchedules(nodes) {
  return nodes.flatMap((node) => {
    const nodeId = getNodeId(node);
    const nodeName = getNodeName(node);
    const schedules = normalizeSchedules(node?.params?.Schedule?.Schedules);

    return schedules
      .filter((schedule) => schedule?.id)
      .map((schedule) => ({
        ...schedule,
        key: `${nodeId}:${schedule.id}`,
        nodeId,
        nodeName,
      }));
  });
}

export function getScheduleServiceNodes(nodes) {
  return nodes.filter(hasScheduleService).map((node) => ({
    id: getNodeId(node),
    name: getNodeName(node),
  }));
}

function hasScheduleService(node) {
  const devices = getNodeDevices(node);

  return devices.some(
    (device) =>
      device?.name === 'Schedule' ||
      device?.type === 'esp.service.schedule' ||
      device?.params?.some((param) => param?.name === 'Schedules' || param?.type === 'esp.param.schedules'),
  );
}

function normalizeSchedules(schedules) {
  if (Array.isArray(schedules)) {
    return schedules;
  }

  if (typeof schedules === 'string') {
    try {
      const parsed = JSON.parse(schedules);
      return normalizeSchedules(parsed);
    } catch (error) {
      return [];
    }
  }

  if (schedules && typeof schedules === 'object') {
    if (Array.isArray(schedules.value)) {
      return schedules.value;
    }

    if (typeof schedules.value === 'string') {
      return normalizeSchedules(schedules.value);
    }
  }

  return [];
}
