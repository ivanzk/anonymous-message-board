/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

const testThread = {
  text: 'The message on tboard.',
  delete_password: '123'
};
const testThread2 = {
  text: 'The message on tboard.',
  delete_password: '123',
  reply: 'Comment...'
};

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Post a new thread to tboard. User input: TEXT, DELETE_PASSWORD', (done) => {
        chai.request(server)
          .post('/api/threads/tboard')
          .send({
            text: testThread.text,
            delete_password: testThread.delete_password
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          })
      });
      test('Post another thread to tboard. User input: TEXT, DELETE_PASSWORD', (done) => {
        chai.request(server)
          .post('/api/threads/tboard')
          .send({
            text: testThread2.text,
            delete_password: testThread2.delete_password
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          })
      });
    });
    
    
    suite('GET', function() {
      test('Get all threads from tboard', (done) => {
        chai.request(server)
          .get('/api/threads/tboard/')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);  
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'replies');
            assert.property(res.body[0], 'replycount');
            assert.notProperty(res.body[0], 'delete_password');
            assert.notProperty(res.body[0], 'reported');
            assert.equal(res.body[0].text, testThread.text);
            assert.isAtMost(res.body[0].replies.length, 3);
            testThread.id = res.body[1]._id;
            testThread2.id = res.body[0]._id;
            done();
          })
      });
    });
    
    suite('PUT', function() {
      test('Report the first message', (done) => {
        chai.request(server)
          .put('/api/threads/tboard')
          .send({thread_id: testThread.id})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          })
      });
    });
    
    suite('DELETE', function() {
      test('Delete the thread - incorrect password', (done) => {
        chai.request(server)
          .delete('/api/threads/tboard')
          .send({thread_id: testThread.id, delete_password: testThread.delete_password + 'wrong'})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      test('Delete the thread - correct password', (done) => {
        chai.request(server)
          .delete('/api/threads/tboard')
          .send({thread_id: testThread.id, delete_password: testThread.delete_password})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    

  });
  
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post a reply', (done) => {
        chai.request(server)
          .post('/api/replies/tboard/')
          .send({
            thread_id: testThread2.id,
            text: testThread2.reply,
            delete_password: testThread2.delete_password
          })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();  
        });
      });
    });
    
    suite('GET', function() {
      test('Get replies', (done) => {
        chai.request(server)
          .get('/api/replies/tboard/')
          .query({thread_id: testThread2.id})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isAtLeast(res.body.replies.length, 1);
            assert.property(res.body.replies[0], '_id');
            assert.property(res.body.replies[0], 'text');
            assert.property(res.body.replies[0], 'created_on');
            assert.notProperty(res.body.replies[0], 'delete_password');
            assert.notProperty(res.body.replies[0], 'reported');
            testThread2.replyId = res.body.replies[0]._id;
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Report a reply', (done) => {
        chai.request(server)
          .put('/api/replies/tboard')
          .send({
            thread_id: testThread2.id,
            reply_id: testThread2.replyId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Delete a reply - incorrect password', (done) => {
        chai.request(server)
          .delete('/api/replies/tboard')
          .send({
            thread_id: testThread2.id,
            reply_id: testThread2.replyId,
            delete_password: testThread2.delete_password + 'wrong'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      test('Delete a reply - correct password', (done) => {
        chai.request(server)
          .delete('/api/replies/tboard')
          .send({
            thread_id: testThread2.id,
            reply_id: testThread2.replyId,
            delete_password: testThread2.delete_password
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
      test('Deleted reply text was changed to [deleted]', (done) => {
        chai.request(server)
          .get('/api/replies/tboard/')
          .query({thread_id: testThread2.id})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body.replies[0].text, '[deleted]');
            done();
          });
      });
    });
    
  });
  
});
