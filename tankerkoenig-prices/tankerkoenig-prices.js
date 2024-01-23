const axios = require('axios').default;

const ROOT_URL = 'https://creativecommons.tankerkoenig.de/json/prices.php';
const MAX_ID_COUNT = 10;

function assembleConfig(msg, node) {
	const config = {
		ids: node.ids || msg.ids,
		apikey: node.apikey,
		output: node.output || msg.output || 'object',
	};
	config.idCount = config.ids.split(',').length;
	return config;
}

function assembleUrl(config) {
	function assembleQuery({ ids, apikey }) {
		return `ids=${ids}&apikey=${apikey}`;
	}

	return `${ROOT_URL}?${assembleQuery(config)}`;
}

function formatAsArray(object) {
	let array = [];
	for (let key in object) {
		array.push({ id: key, ...object[key] });
	}
	return array;
}

async function fetchFuelData(msg, node) {
	try {
		const config = assembleConfig(msg, node);
		if (config.idCount > MAX_ID_COUNT) throw new Error('Too many IDs. Max 10 allowed');

		const url = assembleUrl(config);
		const response = await axios.get(url);
		if (response.data.status === 'error') {
			throw new Error(response.data.message);
		}

		const data = response.data;
		if (config.output.toLowerCase() === 'array') {
			const array = formatAsArray(data.prices);
			return [{ ...data, prices: array }, null];
		}

		if (config.output.toLowerCase() === 'object') {
			return [data, null];
		}

		throw new Error(`Output type ${config.output} not recognized. Use 'object' or 'array' instead`);
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
			node.status({ fill: 'green', shape: 'ring', text: 'OK' });
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
			this.ids = config.ids;
			this.output = config.output;
			this.name = config.name;

			this.on('input', (msg, send, done) => onInput(msg, send, done, this));
		} catch (error) {
			RED.log.error(error);
		}
	}
	RED.nodes.registerType('tankerkoenig-prices', createTankerkoenigClient);
};
