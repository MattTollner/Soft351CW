const assert = require('chai').assert;
const server = require('../server');

describe('Server', function(){
    it('App should return hello', function(){
        assert.equal(server(),'hello');                  
    });
});
