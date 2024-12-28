const axios = require('axios');
const api = axios.create({})

var Service, Characteristic;

const DEF_MIN_RATE = -10000,
      DEF_MAX_RATE = 10000;

const interval = 5 // Minutes

const PLUGIN_NAME   = 'homebridge-localvolts-price';
const ACCESSORY_NAME = 'LocalVolts Price';

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, LocalVoltsPrice);
}

class LocalVoltsPrice {
    constructor(log, config) {
    	this.log = log
    	this.config = config
    	this.service = new Service.TemperatureSensor(this.config.name)
    	this.name = config["name"];
    	this.manufacturer = config["manufacturer"] || "LocalVolts Price";
	    this.model = config["model"] || "Monitor";
	    this.apiKey = config["apiKey"] || "API Key";
	    this.apiId = config["apiId"] || "API ID";
	    this.minRate = config["min_rate"] || DEF_MIN_RATE;
    	this.maxRate = config["max_rate"] || DEF_MAX_RATE;
	this.refreshInterval = config["refreshInterval"] === undefined ? (interval * 60000) : (config["refreshInterval"] * 60000)
	this.timer = setTimeout(this.poll.bind(this), this.refreshInterval)
	this.poll()
    }

    getServices () {
    	const informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
	    return [informationService, this.service]
    }

    async poll() {
		if(this.timer) clearTimeout(this.timer)
		this.timer = null
		try {
//		    const hourlyData = await api.get('https://hourlypricing.comed.com/api?type=currenthouraverage')
			const headers = {
				"authorization": `apikey ${self.apiKey}`,
				"partner": self.apiId
			}
		    const localvoltsData = await api.get(`https://api.localvolts.com/v1/customer/interval?NMI=${this.nmi}`, {headers: headers});
		    // feed_in_kwh => 'earningsFlexUp'
        	// general_kwh => 'costsFlexUp'
			this.log.info('Data from API', localvoltsData.data[0].costsFlexUp);
		    if (localvoltsData.data[0].costsFlexUp == null) {
		        // No price in hourlyData, return maximum allowed value
		        this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(DEF_MAX_RATE)
		    } else {
		        // Return positive value
		        this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(localvoltsData.data[0].costsFlexUp, 1)
		    }
		} catch (error) {
		    this.log.error('Error getting current 30m estimated price %s', error)
		    // No response hourlyData, return maximum allowed value
		    this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(DEF_MAX_RATE)
		}
		this.timer = setTimeout(this.poll.bind(this), this.refreshInterval)
    }

    convertToFahrenheit(value) {
        return (value-32)*5/9;
    }
}

module.exports.LocalVoltsPrice = LocalVoltsPrice;