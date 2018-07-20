(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var colors = Package['nooitaf:colors'].colors;

/* Package-scope variables */
var InstanceStatus;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/konecty_multiple-instances-status/multiple-instances-status.js                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var events = new (Npm.require('events').EventEmitter)(),
	collectionName = process.env.MULTIPLE_INSTANCES_COLLECTION_NAME || 'instances',
	defaultPingInterval = (process.env.MULTIPLE_INSTANCES_PING_INTERVAL || 10); // default to 10s

var Instances = new Meteor.Collection(collectionName);

var InstancesRaw = Instances.rawCollection();

// if not set via env var ensures at least 3 ticks before expiring (multiple of 60s)
var indexExpire = parseInt(process.env.MULTIPLE_INSTANCES_EXPIRE || (Math.ceil(defaultPingInterval * 3 / 60) * 60));

InstancesRaw.indexes()
	.catch(function() {
		// the collection should not exists yet, return empty then
		return [];
	})
	.then(function(result) {
		return result.some(function(index) {
			if (index.key && index.key['_updatedAt'] === 1) {
				if (index.expireAfterSeconds !== indexExpire) {
					InstancesRaw.dropIndex(index.name);
					return false;
				}
				return true;
			}
		})
	})
	.then(function(created) {
		if (!created) {
			InstancesRaw.createIndex({_updatedAt: 1}, {expireAfterSeconds: indexExpire});
		}
	});

InstanceStatus = {
	name: undefined,
	extraInformation: undefined,

	events: events,

	getCollection: function() {
		return Instances;
	},

	registerInstance: function(name, extraInformation) {
		InstanceStatus.name = name;
		InstanceStatus.extraInformation = extraInformation;

		if (InstanceStatus.id() === undefined || InstanceStatus.id() === null) {
			return console.error('[multiple-instances-status] only can be called after Meteor.startup');
		}

		var now = new Date(),
			instance = {
				$set: {
					pid: process.pid,
					name: name
				},
				$currentDate: {
					_createdAt: true,
					_updatedAt: true
				}
			};

		if (extraInformation) {
			instance.$set.extraInformation = extraInformation;
		}

		try {
			Instances.upsert({_id: InstanceStatus.id()}, instance);
			var result = Instances.findOne({_id: InstanceStatus.id()});
			InstanceStatus.start();

			events.emit('registerInstance', result, instance);

			process.on('exit', InstanceStatus.onExit);

			return result;
		} catch (e) {
			return e;
		}
	},

	unregisterInstance: function() {
		try {
			var result = Instances.remove({_id: InstanceStatus.id()});
			InstanceStatus.stop();

			events.emit('unregisterInstance', InstanceStatus.id());

			process.removeListener('exit', InstanceStatus.onExit);

			return result;
		} catch (e) {
			return e;
		}
	},

	start: function(interval) {
		InstanceStatus.stop();

		interval = interval || defaultPingInterval;

		InstanceStatus.interval = Meteor.setInterval(function() {
			InstanceStatus.ping();
		}, interval * 1000);
	},

	stop: function(interval) {
		if (InstanceStatus.interval) {
			InstanceStatus.interval.close();
			delete InstanceStatus.interval;
		}
	},

	ping: function() {
		var count = Instances.update(
			{
				_id: InstanceStatus.id()
			},
			{
				$currentDate: {
					_updatedAt: true
				}
			});

		if (count === 0) {
			InstanceStatus.registerInstance(InstanceStatus.name, InstanceStatus.extraInformation);
		}
	},

	onExit: function() {
		InstanceStatus.unregisterInstance();
	},

	activeLogs: function() {
		Instances.find().observe({
			added: function(record) {
				var log = '[multiple-instances-status] Server connected: ' + record.name + ' - ' + record._id;
				if (record._id == InstanceStatus.id()) {
					log += ' (me)';
				}
				console.log(log.green);
			},
			removed: function(record) {
				var log = '[multiple-instances-status] Server disconnected: ' + record.name + ' - ' + record._id;
				console.log(log.red);
			}
		});
	},

	id: function() {}
};

Meteor.startup(function() {
	var ID = Random.id();

	InstanceStatus.id = function() {
		return ID;
	};
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("konecty:multiple-instances-status", {
  InstanceStatus: InstanceStatus
});

})();
