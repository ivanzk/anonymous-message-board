/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

const MONGODB_URI = process.env.MONGODB_URI;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

module.exports = function (app) {
  mongoose.connect(MONGODB_URI, {useNewUrlParser: true}, (err) => {
    if (err) return console.error(err);
    console.log('Connected to MONGODB');
  });
  
  
  const replySchema = new mongoose.Schema({
    text: {
      type: String,
      required: true
    },
    reported: {
      type: Boolean,
      default: false
    },
    delete_password: {
      type: String,
      required: true,
      set: password => bcrypt.hashSync(password, 12)
    }
  }, {
    timestamps: {
      createdAt: 'created_on',
      updatedAt: 'bumped_on'
    }
  });
  
  const threadSchema = new mongoose.Schema({
    board: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    reported: {
      type: Boolean,
      default: false
    },
    delete_password: {
      type: String,
      required: true,
      set: password => bcrypt.hashSync(password, 12)
    },
    replies: {
      type: [replySchema]
    },
  }, {
    timestamps: {
      createdAt: 'created_on',
      updatedAt: 'bumped_on'
    }
  });
  
  threadSchema.virtual('countReplies').get(function() {
    return this.replies.length || 0;
  });
  threadSchema.virtual('filterReplies').get(function() {
    return this.replies
      .slice(-3)
      .map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on,
        bumped_on: reply.bumped_on
      }));
  });
  
  const Thread = mongoose.model('Thread', threadSchema);
    
  
  // /api/threads/:board
  app.route('/api/threads/:board')
    .get((req, res) => {
      Thread
        .find({board: req.params.board})
        .sort({bumped_on: -1})
        .limit(10)
        .select({reported: 0, delete_password: 0, board: 0})
        .exec((err, threads) => {
          if (err) {
            console.error(err);
            return;
          }
          threads = threads.map(thread => {
            const replycount = thread.countReplies;
            const filteredReplies = thread.filterReplies;
            return {...thread._doc, replies: filteredReplies, replycount: replycount};
          });
          res.json(threads);
        });
    })
  
    .post((req, res) => {
      const thread = new Thread({
        board: req.params.board,
        text: req.body.text,
        delete_password: req.body.delete_password
      });
      
      thread.save((err, thread) => {
        if (err) {
          console.error(err);
          res.redirect(`/b/${req.params.board}/`);
          return;
        }
        res.redirect(`/b/${req.params.board}/`);
      });
    })
  
    .put((req, res) => {
      Thread
        .findByIdAndUpdate(req.body.report_id, {$set: {reported: true}})
        .exec((err, thread) => {
          if (err) {
            console.error(err);
            return;
          }
          res.send('success');
        });
    })
  
    .delete((req, res) => {
      Thread.findById(req.body.thread_id, (err, thread) => {
        if (err) {
          console.error(err);
          res.redirect(`/b/${req.params.board}/`);
          return;
        }
        if (bcrypt.compareSync(req.body.delete_password, thread.delete_password)) {
          thread.remove();
          res.send('success');
        } else {
          res.send('incorrect password');
        }
      });
    });
    
  
  // /api/replies/:board
  app.route('/api/replies/:board')
    .get((req, res) => {
      Thread
        .findById(req.query.thread_id)
        .select({reported: 0, delete_password: 0, board: 0})
        .exec((err, thread) => {
          if (err) {
            console.error(err);
            return;
          }
          
          res.json({...thread._doc, replies: thread.replies.map(reply => {
            return {
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on,
              bumped_on: reply.bumped_on
            }})
          });
        });
    })
  
    .post((req, res) => {
      Thread.findByIdAndUpdate(
        req.body.thread_id, 
        {$push: {replies: {text: req.body.text, delete_password: req.body.delete_password}}},
        {upsert: true, new: true, runValidators: true}
      )
      .exec((err, thread) => {
        if (err) {
          console.error(err);
          return;
        }
        res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
      });
    })
  
    .put((req, res) => {
      Thread.findById(req.body.thread_id, (err, thread) => {
        if (err) {
          console.error(err);
          return;
        }
        
        thread.replies.id(req.body.reply_id).reported = true;
        
        thread.save((err) => {
          if (err) {
            console.error(err);
            return;
          }
          res.send('success');
        });
      });
    })
  
    .delete((req, res) => {
      Thread.findById(req.body.thread_id, (err, thread) => {
        if (err) {
          console.error(err);
          return;
        }
        
        const reply = thread.replies.id(req.body.reply_id);
        if (bcrypt.compareSync(req.body.delete_password, reply.delete_password)) {
          reply.text = '[deleted]';
          thread.save((err) => {
            if (err) {
              console.error(err);
              return;
            }
            res.send('success');
          });
        } else {
          res.send('incorrect password');
        }
      });
    });

};
