module.exports = function (RED) {
	function createTankerkoenigConfig(config) {
		try {
			RED.nodes.createNode(this, config);
			this.apikey = config.apikey;
			this.name = config.name;
		} catch (error) {
			RED.log.error(error);
		}
	}
	RED.nodes.registerType('tankerkoenig-config', createTankerkoenigConfig);
};
