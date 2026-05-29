export function getAutomationId(automation) {
  return automation?.automation_id || automation?.id || automation?.trigger_id || '';
}

export function getAutomationName(automation) {
  return automation?.name || automation?.automation_name || automation?.metadata?.name || 'Automation';
}

export function getRelayLabel(relay, names) {
  return names[relay?.key]?.trim() || relay?.defaultName || 'Relay';
}

export function formatAutomationSummary(automation) {
  const event = automation?.events?.[0];
  const action = automation?.actions?.[0];
  const eventText = formatParamBlock(event?.params);
  const actionText = formatParamBlock(action?.params);

  if (eventText && actionText) {
    return `When ${eventText}, set ${actionText}`;
  }

  if (!automation?.events?.length || !automation?.actions?.length) {
    const type = automation?.event_type || automation?.type || automation?.trigger_type;
    const nodeId = automation?.node_id;

    if (type || nodeId) {
      return [type, nodeId].filter(Boolean).join(' on ');
    }

    return 'Automation details available in RainMaker';
  }

  return automation?.enabled === false ? 'Disabled' : 'Enabled';
}

export function validateAutomationDraft({ triggerRelay, actionRelay, triggerValue, actionValue, automations }) {
  if (!triggerRelay || !actionRelay) {
    return 'Choose both a trigger device and an action device.';
  }

  if (!isValidRelay(triggerRelay) || !isValidRelay(actionRelay)) {
    return 'Only valid boolean relay controls can be used for automations.';
  }

  if (typeof triggerValue !== 'boolean' || typeof actionValue !== 'boolean') {
    return 'Choose ON or OFF for both automation steps.';
  }

  if (triggerRelay.key === actionRelay.key) {
    return 'Choose a different action device to avoid a self-triggering automation.';
  }

  const duplicate = automations.some((automation) =>
    automationMatchesDraft(automation, { triggerRelay, actionRelay, triggerValue, actionValue }),
  );

  if (duplicate) {
    return 'This automation already exists.';
  }

  return '';
}

export function assertAutomationPayload(automation) {
  const message = validateAutomationDraft({
    triggerRelay: automation?.trigger,
    actionRelay: automation?.action,
    triggerValue: automation?.trigger?.value,
    actionValue: automation?.action?.value,
    automations: [],
  });

  if (message) {
    throw new Error(message);
  }

  if (!automation.name || automation.name.length > 256) {
    throw new Error('Automation name must be 1 to 256 characters long.');
  }
}

function isValidRelay(relay) {
  return Boolean(
    relay?.nodeId &&
      relay?.deviceName &&
      relay?.paramName &&
      typeof relay?.value === 'boolean',
  );
}

function automationMatchesDraft(automation, draft) {
  const event = automation?.events?.[0];
  const action = automation?.actions?.[0];
  const eventParam = getFirstParam(event?.params);
  const actionParam = getFirstParam(action?.params);

  return (
    automation?.node_id === draft.triggerRelay.nodeId &&
    action?.node_id === draft.actionRelay.nodeId &&
    eventParam.deviceName === draft.triggerRelay.deviceName &&
    eventParam.paramName === draft.triggerRelay.paramName &&
    eventParam.value === draft.triggerValue &&
    actionParam.deviceName === draft.actionRelay.deviceName &&
    actionParam.paramName === draft.actionRelay.paramName &&
    actionParam.value === draft.actionValue
  );
}

function getFirstParam(params = {}) {
  const [deviceName, deviceParams = {}] = Object.entries(params)[0] || [];
  const [paramName, value] = Object.entries(deviceParams)[0] || [];

  return {
    deviceName,
    paramName,
    value,
  };
}

function formatParamBlock(params = {}) {
  const { deviceName, paramName, value } = getFirstParam(params);

  if (!deviceName || !paramName) {
    return '';
  }

  return `${deviceName} ${paramName} ${value ? 'ON' : 'OFF'}`;
}
