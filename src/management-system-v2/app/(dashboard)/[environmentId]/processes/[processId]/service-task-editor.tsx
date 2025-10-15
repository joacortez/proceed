'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Button,
  Space,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Divider,
  Card,
  Tag,
  App,
  Spin,
  Result,
  Typography,
} from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';

import useModelerStateStore from './use-modeler-state-store';
import { useEnvironment } from '@/components/auth-can';
import { generateServiceTaskFileName } from '@proceed/bpmn-helper';
import { useCanEdit } from './modeler';
import { useQuery } from '@tanstack/react-query';
import { isUserErrorResponse, userError } from '@/lib/user-error';
import { wrapServerCall } from '@/lib/wrap-server-call';
import useProcessVariables from './use-process-variables';
import ProcessVariableForm from './variable-definition/process-variable-form';
import {
  SERVICE_PROTOCOLS,
  ServiceProtocol,
  ProtocolField,
  getProtocolById,
} from './service-task-protocols';
import { getProcessScriptTaskData, saveProcessScriptTask } from '@/lib/data/processes';

const { TextArea } = Input;
const { Text, Title } = Typography;

type ServiceTaskEditorProps = {
  processId: string;
  open: boolean;
  onClose: () => void;
  selectedElement: any;
};

interface ServiceTaskConfig {
  protocol: string;
  fields: Record<string, any>;
}

const ServiceTaskEditor: FC<ServiceTaskEditorProps> = ({
  processId,
  open,
  onClose,
  selectedElement,
}) => {
  const [form] = Form.useForm();
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConfigValid, setIsConfigValid] = useState(true);
  const [isProgrammaticChange, setIsProgrammaticChange] = useState(false);

  const modeler = useModelerStateStore((state) => state.modeler);
  const canEdit = useCanEdit();
  const environment = useEnvironment();
  const app = App.useApp();

  const { variables, addVariable } = useProcessVariables();
  const [showVariableForm, setShowVariableForm] = useState(false);

  const filename = useMemo(() => {
    if (modeler && selectedElement && selectedElement.type === 'bpmn:ServiceTask') {
      return (
        (selectedElement.businessObject.fileName as string | undefined) ||
        generateServiceTaskFileName()
      );
    }
    return undefined;
  }, [modeler, selectedElement]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryFn: async () => {
      if (!filename) return null;

      // NOTE change to discrete service task function?
      const configData = await getProcessScriptTaskData(
        processId,
        filename,
        'ts',
        environment.spaceId,
      );

      if (isUserErrorResponse(configData)) {
        return null;
      }

      try {
        return JSON.parse(configData as string) as ServiceTaskConfig;
      } catch {
        return null;
      }
    },
    enabled: open && !!filename,
    queryKey: ['processServiceTaskData', environment.spaceId, processId, filename],
  });

  useEffect(() => {
    console.log('init called');
    setIsProgrammaticChange(true);
    if (data) {
      setSelectedProtocol(data.protocol);
      const fieldsToSet = { ...data.fields };

      // If protocol supports modes but no mode is set in data, set default to first option
      // const protocolConfig = getProtocolById(data.protocol);
      // if (protocolConfig?.supportsModes && !fieldsToSet.mode) {
      //   const modeField = protocolConfig.fields.find((f) => f.name === 'mode');
      //   if (modeField?.options?.[0]) {
      //     fieldsToSet.mode = modeField.options[0].value;
      //   }
      // }

      form.setFieldsValue(fieldsToSet);
      setHasUnsavedChanges(false);
    } else {
      setSelectedProtocol(undefined);
      form.resetFields();
      setHasUnsavedChanges(false);
    }
    setTimeout(() => setIsProgrammaticChange(false), 0);
  }, [data, form]);

  const selectedProtocolConfig = useMemo(() => {
    return selectedProtocol ? getProtocolById(selectedProtocol) : undefined;
  }, [selectedProtocol]);

  const handleProtocolChange = (protocolId: string) => {
    console.log('handleProtocolChange called');
    if (hasUnsavedChanges) {
      app.modal.confirm({
        title: 'You have unsaved changes!',
        content: 'Switching protocols will discard your current changes. Are you sure?',
        onOk: () => {
          setIsProgrammaticChange(true);
          setSelectedProtocol(protocolId);
          form.resetFields();
          // const newProtocolConfig = getProtocolById(protocolId);
          // if (newProtocolConfig?.supportsModes) {
          //   const modeField = newProtocolConfig.fields.find((f) => f.name === 'mode');
          //   if (modeField?.options?.[0]) {
          //     form.setFieldsValue({ mode: modeField.options[0].value });
          //   }
          // }
          setHasUnsavedChanges(false);
          setTimeout(() => setIsProgrammaticChange(false), 0);
        },
        okText: 'Switch Protocol',
        cancelText: 'Keep Current',
      });
    } else {
      setIsProgrammaticChange(true);
      setSelectedProtocol(protocolId);
      form.resetFields();
      // const newProtocolConfig = getProtocolById(protocolId);
      // if (newProtocolConfig?.supportsModes) {
      //   const modeField = newProtocolConfig.fields.find((f) => f.name === 'mode');
      //   if (modeField?.options?.[0]) {
      //     form.setFieldsValue({ mode: modeField.options[0].value });
      //   }
      // }
      setHasUnsavedChanges(false);
      setTimeout(() => setIsProgrammaticChange(false), 0);
    }
  };

  const generateServiceTaskCode = (protocol: ServiceProtocol, formValues: Record<string, any>) => {
    // Check if this is a receive/listen mode
    const isReceiveMode = formValues.mode === 'receive';

    // Create payload object with all form fields + protocol type
    const payloadEntries = [
      `  protocol: '${protocol.id}'`,
      ...Object.entries(formValues).map(
        ([key, value]) => `  ${key}: ${typeof value === 'string' ? `'${value}'` : value}`,
      ),
    ];

    const payload = payloadEntries.join(',\n');

    if (isReceiveMode) {
      // TBD: Receive mode code generation
      return `// TBD: Receive/Listen mode implementation for ${protocol.name}
// This will be implemented to handle incoming data/messages

// Configuration data for receive mode:
const config = {
${payload}
};

// TODO: Implement receive/listen logic based on protocol:
// - HTTP: Set up webhook endpoint listener
// - MQTT: Subscribe to topics and handle incoming messages  
// - Email: Monitor inbox for new emails
// 
// For now, this is marked as TBD (To Be Done)
log.info('Receive mode configuration saved, implementation pending');
log.debug('Config:', JSON.stringify(config, null, 2));

// Placeholder - actual receive logic will be implemented later
variable.set('serviceTaskConfig', config);`;
    }

    // Standard send mode code template for all protocols
    return `const network = getService('network');

// Prepare payload with form data and protocol type
const data = {
${payload}
};

try {
  const { response, body } = await network.post(
    'http://localhost:1880/service',
    data,
    'application/json'
  );
  
  log.info(\`Service request successful! Status: \${response.statusCode}\`);
  log.debug(\`Response body: \${body}\`);
  
  // Set result to process variable
  variable.set('serviceTaskResult', body);
} catch (error) {
  if (error.response) {
    log.error(\`Service request failed: \${error.response.statusCode}\`);
    throw new BpmnEscalation('SERVICE_ERROR', 'Service request failed');
  } else {
    log.error(\`Network error during service request: \${error.message}\`);
    throw new BpmnError('NETWORK_FAILURE', 'Could not reach service');
  }
}`;
  };

  const handleSave = async () => {
    console.log('handleSave called', {
      saving,
      modeler: !!modeler,
      filename,
      selectedElement: !!selectedElement,
      selectedProtocolConfig: !!selectedProtocolConfig,
    });

    if (saving || !modeler || !filename || !selectedElement || !selectedProtocolConfig) return;

    try {
      const formValues = await form.validateFields();
      console.log('Form values:', formValues);
      setSaving(true);

      modeler.getModeling().updateProperties(selectedElement, {
        fileName: filename,
      });

      const config: ServiceTaskConfig = {
        protocol: selectedProtocol!,
        fields: formValues,
      };

      const jsCode = generateServiceTaskCode(selectedProtocolConfig, formValues);

      await wrapServerCall({
        fn: async () => {
          const responses = await Promise.all([
            // NOTE change to discrete Service task function??
            saveProcessScriptTask(
              processId,
              filename,
              'ts',
              JSON.stringify(config, null, 2),
              environment.spaceId,
            ),
            saveProcessScriptTask(processId, filename, 'js', jsCode, environment.spaceId),
          ]);

          return responses.find(isUserErrorResponse);
        },
        onSuccess: () => {
          app.message.success('Service task configuration saved');
          setHasUnsavedChanges(false);
          refetch(); // Refresh the data
        },
        onError: () => {
          app.message.error('Failed to save service task configuration');
        },
        app,
      });
    } catch (error) {
      console.error('Validation failed:', error);
      app.message.error('Please check your form inputs');
    } finally {
      setSaving(false);
    }
  };
  const handleClose = () => {
    if (!canEdit || !hasUnsavedChanges) {
      onClose();
    } else {
      app.modal.confirm({
        title: 'You have unsaved changes!',
        content: 'Are you sure you want to close without saving?',
        onOk: () => handleSave().then(onClose),
        okText: 'Save',
        cancelText: 'Discard',
        onCancel: () => {
          onClose();
          setHasUnsavedChanges(false);
        },
      });
    }
  };

  const renderFormField = (field: ProtocolField) => {
    const commonProps = {
      disabled: !canEdit,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'textarea':
        return <TextArea rows={4} {...commonProps} />;
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            min={field.validation?.min}
            max={field.validation?.max}
            style={{ width: '100%' }}
          />
        );
      case 'select':
        return <Select {...commonProps} options={field.options} />;
      case 'radio':
        // Special styling for mode field to create a full-width segmented control
        if (field.name === 'mode') {
          return (
            <Radio.Group
              disabled={!canEdit}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
              buttonStyle="solid"
            >
              {field.options?.map((option) => (
                <Radio.Button
                  key={option.value}
                  value={option.value}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    borderRadius:
                      field.options?.[0]?.value === option.value
                        ? '6px 0 0 6px'
                        : field.options?.[field.options.length - 1]?.value === option.value
                          ? '0 6px 6px 0'
                          : '0',
                  }}
                >
                  {option.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          );
        }
        // Default radio group for other fields
        return (
          <Radio.Group disabled={!canEdit}>
            {field.options?.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );
      case 'password':
        return <Input.Password {...commonProps} />;
      default:
        return <Input {...commonProps} type={field.type} />;
    }
  };

  // const handleValuesChange = (changedValues, allValues) => {
  //   const changedField = Object.keys(changedValues)[0];

  //   // Skip this field if you want to ignore it
  //   if (changedField === "ignoreField") return;

  //   // Check if any field value is dirty (different from initial)
  //   const isDirty = form.isFieldsTouched(true, true);
  //   setHasUnsavedChanges(isDirty);

  //   // Validate only dirty fields
  //   form
  //     .validateFields({ dirty: true })
  //     .then(() => setIsConfigValid(true))
  //     .catch(() => setIsConfigValid(false));
  // };

  const values = Form.useWatch([], form);

  useEffect(() => {
    if (isProgrammaticChange) return;
    console.log('reactive called');
    if (selectedProtocolConfig && values && form.isFieldsTouched()) {
      setHasUnsavedChanges(true);
      form
        .validateFields({ dirty: true })
        .then(() => setIsConfigValid(true))
        .catch(() => setIsConfigValid(false));
    }
  }, [form, values, selectedProtocolConfig]);

  // STUB delete this
  useEffect(() => {
    console.log('hasUnsavedChanges:', hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  // STUB delete this
  useEffect(() => {
    console.log('isProgrammaticChange:', isProgrammaticChange);
  }, [isProgrammaticChange]);

  return (
    <Modal
      open={open}
      centered
      width="90vw"
      styles={{ body: { height: '85vh', marginTop: '0.5rem' }, header: { margin: 0 } }}
      title={
        <span style={{ fontSize: '1.5rem' }}>{canEdit ? 'Edit Service Task' : 'Service Task'}</span>
      }
      onCancel={handleClose}
      footer={
        <Space>
          <Button onClick={handleClose}>Close</Button>
          {canEdit && (
            <Button
              disabled={!isConfigValid || !selectedProtocol}
              loading={saving}
              type="primary"
              onClick={handleSave}
            >
              Save
            </Button>
          )}
        </Space>
      }
    >
      {/* Error display */}
      {isError && (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="Something went wrong while fetching the service task data. Please try again."
          extra={
            <Button type="primary" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {/* Loading Screen */}
      {!isError && isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spin size="large" spinning />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !isError && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Status Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Protocol Configuration
            </Title>
            {!selectedProtocol ? (
              <Tag icon={<ExclamationCircleOutlined />} color="processing">
                No protocol selected
              </Tag>
            ) : isConfigValid ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Configuration is valid.
              </Tag>
            ) : (
              <Tag icon={<ExclamationCircleOutlined />} color="warning">
                Configuration is invalid.
              </Tag>
            )}
          </div>

          <Row gutter={24} style={{ height: 'calc(100% - 10px)' }}>
            {/* Protocol Selection and Form */}
            <Col span={16} style={{ height: '100%' }}>
              <Card
                title={
                  <Space>
                    <SettingOutlined />
                    Service Configuration
                  </Space>
                }
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                styles={{
                  body: {
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                  },
                }}
              >
                {selectedProtocolConfig ? (
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      paddingRight: '8px',
                    }}
                  >
                    <Form form={form} layout="vertical" disabled={!canEdit}>
                      <Divider>
                        <Text type="secondary">{selectedProtocolConfig.description}</Text>
                      </Divider>

                      {selectedProtocolConfig.fields
                        .filter((field) => {
                          // Show field if no condition, or condition is met
                          if (!field.showWhen) return true;
                          const conditionValue = values?.[field.showWhen.field];
                          return conditionValue === field.showWhen.value;
                        })
                        .map((field) => (
                          <Form.Item
                            key={field.name}
                            label={field.name === 'mode' ? '' : field.label}
                            name={field.name}
                            rules={[
                              {
                                required: field.required,
                                message: `Please enter ${field.label.toLowerCase()}`,
                              },
                            ]}
                            style={
                              field.name === 'mode'
                                ? {
                                    marginBottom: '24px',
                                    textAlign: 'center',
                                  }
                                : undefined
                            }
                          >
                            {renderFormField(field)}
                          </Form.Item>
                        ))}
                    </Form>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text type="secondary">
                      Select a protocol from the sidebar to configure the service task
                    </Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Sidebar with Variables and Protocol List */}
            <Col span={8} style={{ height: '100%' }}>
              <div
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  paddingRight: '8px',
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Available Protocols */}
                  <Card title="Available Protocols" size="small">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {SERVICE_PROTOCOLS.map((protocol) => (
                        <Card
                          key={protocol.id}
                          size="small"
                          hoverable
                          onClick={() => canEdit && handleProtocolChange(protocol.id)}
                          style={{
                            cursor: canEdit ? 'pointer' : 'default',
                            border:
                              selectedProtocol === protocol.id
                                ? '2px solid #1890ff'
                                : '1px solid #d9d9d9',
                          }}
                        >
                          <Card.Meta title={protocol.name} description={protocol.description} />
                        </Card>
                      ))}
                    </Space>
                  </Card>

                  {/* Process Variables */}
                  <Card title="Process Variables" size="small">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {variables.map((variable) => (
                        <Tag key={variable.name}>{variable.name}</Tag>
                      ))}
                      <Button size="small" onClick={() => setShowVariableForm(true)}>
                        Add Variable
                      </Button>
                    </Space>
                  </Card>
                </Space>
              </div>
            </Col>
          </Row>

          <ProcessVariableForm
            open={showVariableForm}
            variables={variables}
            onSubmit={(newVar) => {
              addVariable(newVar);
              setShowVariableForm(false);
            }}
            onCancel={() => setShowVariableForm(false)}
          />
        </div>
      )}
    </Modal>
  );
};

export default ServiceTaskEditor;
