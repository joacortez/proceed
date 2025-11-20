export interface ProtocolField {
  name: string;
  type:
    | 'text'
    | 'number'
    | 'password'
    | 'url'
    | 'email'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'toggle';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[]; 
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  showWhen?: {
    field: string;
    value: string;
  }; 
}

export interface ServiceProtocol {
  id: string;
  name: string;
  description: string;
  fields: ProtocolField[];
  supportsModes?: boolean; 
}

export const SERVICE_PROTOCOLS: ServiceProtocol[] = [
  {
    id: 'http',
    name: 'HTTP/REST',
    description: 'Make HTTP requests or setup HTTP endpoints',
    supportsModes: true,
    fields: [
      {
        name: 'mode',
        type: 'radio',
        label: 'Mode',
        required: true,
        options: [
          { label: 'Send Request', value: 'send' },
          { label: 'Receive/Listen', value: 'receive' },
        ],
      },
      {
        name: 'url',
        type: 'url',
        label: 'URL',
        placeholder: 'https://api.example.com/endpoint',
        required: true,
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'method',
        type: 'select',
        label: 'HTTP Method',
        required: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'HEAD', value: 'HEAD' },
        ],
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'headers',
        type: 'textarea',
        label: 'Headers (JSON)',
        placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer token"}',
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'body',
        type: 'textarea',
        label: 'Request Body',
        placeholder: 'JSON payload or form data',
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'timeout',
        type: 'number',
        label: 'Timeout (ms)',
        placeholder: '5000',
        validation: { min: 100, max: 60000 },
        showWhen: { field: 'mode', value: 'send' },
      },
      
      {
        name: 'listenPort',
        type: 'number',
        label: 'Listen Port',
        placeholder: '3000',
        required: true,
        validation: { min: 1024, max: 65535 },
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'endpoint',
        type: 'text',
        label: 'Endpoint Path',
        placeholder: '/webhook or /api/data',
        required: true,
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'method',
        type: 'select',
        label: 'Method',
        required: true,
        options: [
          { label: 'GET', value: 'GET' },
        ],
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'responseMessage',
        type: 'text',
        label: 'Response Message',
        placeholder: 'Data received successfully',
        showWhen: { field: 'mode', value: 'receive' },
      },
    ],
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send emails via SMTP or monitor email inbox',
    supportsModes: true,
    fields: [
      {
        name: 'mode',
        type: 'radio',
        label: 'Mode',
        required: true,
        options: [
          { label: 'Send Email', value: 'send' },
          { label: 'Receive/Monitor', value: 'receive' },
        ],
      },
      
      {
        name: 'to',
        type: 'email',
        label: 'To',
        placeholder: 'recipient@example.com',
        required: true,
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'cc',
        type: 'text',
        label: 'CC',
        placeholder: 'cc1@example.com, cc2@example.com',
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'subject',
        type: 'text',
        label: 'Subject',
        placeholder: 'Email subject',
        required: true,
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'body',
        type: 'textarea',
        label: 'Message Body',
        placeholder: 'Email content...',
        required: true,
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'smtpHost',
        type: 'text',
        label: 'SMTP Host',
        placeholder: 'smtp.gmail.com',
        required: true,
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'smtpPort',
        type: 'number',
        label: 'SMTP Port',
        placeholder: '587',
        validation: { min: 1, max: 65535 },
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'username',
        type: 'text',
        label: 'Username',
        placeholder: 'your-email@example.com',
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'password',
        type: 'password',
        label: 'Password',
        placeholder: 'App password or email password',
        showWhen: { field: 'mode', value: 'send' },
      },
      
      {
        name: 'imapHost',
        type: 'text',
        label: 'IMAP Host',
        placeholder: 'imap.gmail.com',
        required: true,
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'imapPort',
        type: 'number',
        label: 'IMAP Port',
        placeholder: '993',
        validation: { min: 1, max: 65535 },
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'emailUsername',
        type: 'email',
        label: 'Email Username',
        placeholder: 'your-email@example.com',
        required: true,
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'emailPassword',
        type: 'password',
        label: 'Email Password',
        placeholder: 'App password or email password',
        required: true,
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'mailbox',
        type: 'text',
        label: 'Mailbox',
        placeholder: 'INBOX',
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'checkInterval',
        type: 'number',
        label: 'Check Interval (seconds)',
        placeholder: '60',
        validation: { min: 10, max: 3600 },
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'markAsRead',
        type: 'select',
        label: 'Mark as Read',
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        showWhen: { field: 'mode', value: 'receive' },
      },
    ],
  },
  {
    id: 'mqtt',
    name: 'MQTT',
    description: 'Publish messages or subscribe to MQTT broker topics',
    supportsModes: true,
    fields: [
      {
        name: 'mode',
        type: 'radio',
        label: 'Mode',
        required: true,
        options: [
          { label: 'Publish', value: 'send' },
          { label: 'Subscribe', value: 'receive' },
        ],
      },
      {
        name: 'brokerUrl',
        type: 'text',
        label: 'Broker URL',
        placeholder: 'mqtt://localhost:1883 or mqtts://broker.hivemq.com:8883',
        required: true,
        validation: {
          pattern: '^mqtts?://.+',
        },
      },
      {
        name: 'topic',
        type: 'text',
        label: 'Topic',
        placeholder: 'sensors/temperature or home/livingroom/lights',
        required: true,
        validation: {
          min: 1,
          max: 255,
        },
      },
      {
        name: 'clientId',
        type: 'text',
        label: 'Client ID',
        placeholder: 'unique-client-id (optional, auto-generated if empty)',
      },
      {
        name: 'username',
        type: 'text',
        label: 'Username',
        placeholder: 'MQTT broker username (if required)',
      },
      {
        name: 'password',
        type: 'password',
        label: 'Password',
        placeholder: 'MQTT broker password (if required)',
      },
      {
        name: 'connectionTimeout',
        type: 'number',
        label: 'Connection Timeout (ms)',
        placeholder: '5000',
        validation: {
          min: 1000,
          max: 30000,
        },
      },
      {
        name: 'message',
        type: 'textarea',
        label: 'Message',
        placeholder: 'JSON payload or plain text message',
        required: true,
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'qos',
        type: 'select',
        label: 'Quality of Service (QoS)',
        options: [
          { label: '0 - At most once', value: '0' },
          { label: '1 - At least once', value: '1' },
          { label: '2 - Exactly once', value: '2' },
        ],
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'retain',
        type: 'select',
        label: 'Retain Message',
        options: [
          { label: 'No', value: 'false' },
          { label: 'Yes', value: 'true' },
        ],
        showWhen: { field: 'mode', value: 'send' },
      },
      {
        name: 'subscribeQos',
        type: 'select',
        label: 'Subscribe QoS',
        options: [
          { label: '0 - At most once', value: '0' },
          { label: '1 - At least once', value: '1' },
          { label: '2 - Exactly once', value: '2' },
        ],
        showWhen: { field: 'mode', value: 'receive' },
      },
      {
        name: 'messageHandler',
        type: 'select',
        label: 'Message Handler',
        options: [
          { label: 'Store in variable', value: 'variable' },
          { label: 'Trigger process', value: 'trigger' },
          { label: 'Log only', value: 'log' },
        ],
        showWhen: { field: 'mode', value: 'receive' },
      },
    ],
  },
];

export const getProtocolById = (id: string): ServiceProtocol | undefined => {
  return SERVICE_PROTOCOLS.find((protocol) => protocol.id === id);
};

export const getProtocolOptions = () => {
  return SERVICE_PROTOCOLS.map((protocol) => ({
    label: protocol.name,
    value: protocol.id,
  }));
};
