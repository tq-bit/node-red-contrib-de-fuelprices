const axios = require('axios').default;

module.exports = function (RED) {
	const ROOT_URL = 'https://creativecommons.tankerkoenig.de/json/list.php';

	function assembleConfig(msg, node) {
		return {
			lon: msg.lon || node.lon,
			lat: msg.lat || node.lat,
			radius: msg.radius || node.radius,
			fuelType: msg.fuelType || node.fuelType,
			apikey: node.apikey,
		};
	}

	function assembleUrl(config) {
		function assembleQuery({ lon, lat, radius, fuelType, apikey }) {
			return `lng=${lon}&lat=${lat}&rad=${radius}&type=${fuelType}&apikey=${apikey}`;
		}

		return `${ROOT_URL}?${assembleQuery(config)}`;
	}

	async function fetchFuelData(msg, node) {
		try {
			const config = assembleConfig(msg, node);
			const url = assembleUrl(config);
			const response = await axios.get(url);
			if (response.data.status === 'error') {
				throw new Error(response.data.message);
			}
			return [response.data, null];
		} catch (error) {
			return [null, error];
		}
	}

	async function onInput(msg, send, done, node) {
		try {
			const [data, error] = await fetchFuelData(msg, node);
			if (error) throw error;
			console.log(data);
			msg.payload = data;
			send(msg);
			done();
		} catch (error) {
			node.status({ fill: 'red', shape: 'ring', text: error?.message ?? error });
			RED.log.error(error);
		}
	}
	function createTankerkoenigClient(config) {
		try {
			RED.nodes.createNode(this, config);
			this.config = RED.nodes.getNode(config.config);
			this.apikey = this.config.apikey;
			this.lon = config.lon || '8.531007';
			this.lat = config.lat || '52.019101';
			this.radius = config.radius || '5';
			this.fuelType = config.fuelType || 'all';
			this.name = config.name;

			this.on('input', (msg, send, done) => onInput(msg, send, done, this));
		} catch (error) {
			RED.log.error(error);
		}
	}
	RED.nodes.registerType('tankerkoenig-client', createTankerkoenigClient);
};
