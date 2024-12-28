const nock = require('nock');
const { Service, Characteristic } = require('hap-nodejs');
const localVoltsPricePlugin = require('../index.js');
const { LocalVoltsPrice } = require('../index.js');

// Minimal log mock
function createMockLog() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

describe('LocalVoltsPrice Plugin', () => {
  let log, config, energyPrice;

  // Mock a "homebridge" object
  const homebridgeMock = {
    hap: {
      Service,
      Characteristic
    },
    registerAccessory: jest.fn(),
  };

  beforeAll(() => {
    // Simulate Homebridge calling your plugin
    localVoltsPricePlugin(homebridgeMock);
  });

  beforeEach(() => {
    log = createMockLog();
    config = {
      name: 'Test LocalVolts',
      apiId: 'testApiId',
      apiKey: 'testApiKey',
      refreshInterval: 0.001, // short interval for test
      nmi: 'abcdefg1234',
    };

    // Now we can safely new-up your accessory
    energyPrice = new LocalVoltsPrice(log, config);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  test('poll() should update characteristic with valid data', async () => {
    // Arrange mock API response
    nock('https://api.localvolts.com')
      .get('/v1/customer/interval')
      .query({ NMI: 'abcdefg1234' })
      .reply(200, [{ costsFlexUp: 42 }]);

    // Act
    await energyPrice.poll();

    // Assert
    expect(log.info).toHaveBeenCalledWith('Data from API', 42);
    const currentValue = energyPrice.service
      .getCharacteristic(Characteristic.CurrentTemperature).value;
    expect(currentValue).toBe(42);
  });
});
