import moment from 'moment';

Meteor.methods({
	updateMessageWithButton(message) {

		check(message, Match.ObjectIncluding({_id:String}));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateMessage' });
		}

		return RocketChat.updateMessage(message, Meteor.user());
	}
});
