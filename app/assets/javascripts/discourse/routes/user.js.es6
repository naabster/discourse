export default Discourse.Route.extend({

  titleToken: function() {
    var model = this.modelFor('user');
    var username = model.get('username');
    if (username) {
      return [I18n.t("user.profile"), username];
    }
  },

  actions: {
    logout: function() {
      Discourse.logout();
    },

    composePrivateMessage: function() {
      var user = this.modelFor('user');
      return this.controllerFor('composer').open({
        action: Discourse.Composer.PRIVATE_MESSAGE,
        usernames: user.get('username'),
        archetypeId: 'private_message',
        draftKey: 'new_private_message'
      });
    }
  },

  model: function(params) {
    // If we're viewing the currently logged in user, return that object
    // instead.
    var currentUser = Discourse.User.current();
    if (currentUser && (params.username.toLowerCase() === currentUser.get('username_lower'))) {
      return currentUser;
    }

    return Discourse.User.create({username: params.username});
  },

  afterModel: function() {
    return this.modelFor('user').findDetails();
  },

  serialize: function(model) {
    if (!model) return {};
    return { username: (Em.get(model, 'username') || '').toLowerCase() };
  },

  setupController: function(controller, user) {
    controller.set('model', user);

    // Add a search context
    this.controllerFor('search').set('searchContext', user.get('searchContext'));
  },

  activate: function() {
    this._super();
    var user = this.modelFor('user');
    Discourse.MessageBus.subscribe("/users/" + user.get('username_lower'), function(data) {
      user.loadUserAction(data);
    });
  },

  deactivate: function() {
    this._super();
    Discourse.MessageBus.unsubscribe("/users/" + this.modelFor('user').get('username_lower'));

    // Remove the search context
    this.controllerFor('search').set('searchContext', null);
  }

});