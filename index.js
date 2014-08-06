var root = require('root');
var session = require('noted-session');
var getdb = require('noted-db');
var seaport = require('seaport');
var param = require('param');
var ports = seaport.connect(param('registry.host'), param('registry.port'));
var app = root();

var templates = {};

app.use('response.session', session.set);
app.use('request.session', session.get);

app.use('request.userId', function() {
  return this.session('user');
});

app.get('/api/notes', function(req, res) {
  var db = getdb(req.userId());
  db.notes.find({notebook_id: db.ObjectId(req.query.notebookId)}).sort({updated: -1}, function(err, notes) {
    if (err) return res.error(500, err.toString());
    res.send(notes);
  });
});

app.put('/api/notes/{id}', function(req, res) {
  var db = getdb(req.userId());
  req.on('json', function(note) {
    note._id = db.ObjectId(req.params.id);
    note.notebook_id = db.ObjectId(note.notebook_id);

    db.notes.save(note, function(err, note) {
      if (err) return res.error(500, err.toString());
      res.send(note);
    });
  });
});

app.post('/api/notes', function(req, res) {
  var db = getdb(req.userId());
  req.on('json', function(note) {
    note.notebook_id = db.ObjectId(note.notebook_id);

    db.notes.save(note, function(err, note) {
      if (err) return res.error(500, err.toString());
      res.send(note);
    });
  });
});

app.del('/api/notes/{id}', function(req, res) {
  var db = getdb(req.userId());
  db.notes.remove({_id: db.ObjectId(req.params.id)}, function(err) {
    if (err) return res.error(500, err.toString());
    res.send({ok: true});
  });
});

var port = ports.register('api/notes');
app.listen(port);
console.log('NotEd Notes API server listening on port ' + port);
