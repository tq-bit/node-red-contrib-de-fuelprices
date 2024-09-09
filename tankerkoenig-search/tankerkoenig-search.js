const axios = require('axios').default;

const ROOT_URL = 'https://creativecommons.tankerkoenig.de/json/list.php';

function assembleConfig(msg, node) {
	return {
		lon: node.lon || msg.lon,
		lat: node.lat || msg.lat,
		radius: node.radius || msg.radius,
		fuelType: node.fuelType || msg.fuelType,
		sort: node.sort || msg.sort,
		apikey: node.apikey,
	};
}

function assembleUrl(config) {
	function assembleQuery({ lon, lat, radius, fuelType, apikey, sort }) {
		return `lng=${lon}&lat=${lat}&rad=${radius}&type=${fuelType}&sort=${sort}&apikey=${apikey}`;
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

module.exports = function (RED) {
	async function onInput(msg, send, done, node) {
		try {
			const [data, error] = await fetchFuelData(msg, node);
			if (error) throw error;
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
			this.lon = this.config.lon || '8.531007';
			this.lat = this.config.lat || '52.019101';
			this.radius = this.config.radius || '5';
			this.fuelType = this.config.fuelType || 'all';
			this.sort = this.config.sort || 'price';
			this.name = this.config.name;

			this.on('input', (msg, send, done) => onInput(msg, send, done, this));
		} catch (error) {
			RED.log.error(error);
		}
	}
	RED.nodes.registerType('tankerkoenig-search', createTankerkoenigClient);
};
