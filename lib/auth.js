/*global requirejs,define,fs*/
module.exports = function () {
  const promptly = require('promptly');

  var fs = require('fs');

  var path = require('path');

  var config = require('./config');

  const auth = {
    answers: {},
    ask: function (question, callback, password) {
      var that = this;

      if (password) {
        promptly
          .password(question)
          .then(answer => {
            if (answer.length > 0) {
              callback(answer);
            } else {
              that.ask(question, callback, true);
            }
          })
          .catch(e => {
            if(e && e.message === 'canceled') {
              console.log('\nInput cancelled');
            } else {
              console.log('\nError: ' + e.toString());
            }
          });
      } else {
        promptly
          .prompt(question)
          .then(answer => {
            if (answer.length > 0) {
              callback(answer);
            } else {
              that.ask(question, callback);
            }
          })
          .catch(e => {
            if(e && e.message === 'canceled') {
              console.log('\nInput cancelled');
            } else {
              console.log('\nError: ' + e.toString());
            }
          });
      }
    },
    setup: function (options) {
      var that = this; // Does your config file exist

      if (!config.isLoaded()) {
        // If not then create it
        this.ask('Jira URL: ', function (answer) {
          that.answers.url = answer;
          that.ask('Username: ', function (answer) {
            that.answers.user = answer;
            that.ask('Password: ', function (answer) {
              that.answers.pass = answer;
              process.stdin.destroy();
              that.saveConfig(options);
            }, true);
          });
        });
      }
    },
    clearConfig: function () {
      promptly
        .prompt('Are you sure? ')
        .then(answer => {
          if (answer) {
            config.clear();
            console.log('Configuration deleted successfully!');
          }
  
          process.stdin.destroy();
        })
        .catch(e => {
          if(e && e.message === 'canceled') {
            console.log('\nInput cancelled');
          } else {
            console.log('\nError: ' + e.toString());
          }
        });
    },
    saveConfig: function (options) {
      if (this.answers.url) {
        if (!/\/$/.test(this.answers.url)) {
          this.answers.url += '/';
        }
      }

      if (this.answers.user && this.answers.pass) {
        this.answers.token = this.answers.user + ':' + this.answers.pass;
        const auth = {
          url: this.answers.url,
          user: this.answers.user,
          token: Buffer.from(this.answers.token).toString('base64')
        };
        delete this.answers.pass;

        if (options.verbose) {
          console.log(options);
        }

        if (options.template && fs.existsSync(options.template)) {
          console.log('Using cli supplied default config file');
          config.loadInitialFromTemplate(options.template);
        }

        config.update('auth', auth);
        config.save();
        console.log('Information stored!');
      }
    }
  };
  return auth;
}();
