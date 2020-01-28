
const express = require('express');
const passport = require('passport');
const Strategy = require('passport-http').BasicStrategy;
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger/swagger.yml');
 


app.use(bodyParser.json({limit: '10mb'}));
app.use(cors());
app.use(express.static('swagger'));
app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

let votants = [];

let candidats = [];

let votes = [];

passport.use(new Strategy(
    (username, password, callback) => {
       let table = votants.filter((elem) => elem.name === username && elem.password === password);
       if (table.length > 0) {
        callback(null, table[0]);
       } else {
        callback(null, false);
       }
                          
    })
);


let authVotant = (req, res, next) => {
    passport.authenticate('basic', {session: false}, function(err, user) {
        if (!user) {
            return res.status(401).send({message: 'Username ou password invalide'});
        }

        req.votant = JSON.parse(JSON.stringify(user));
        return next();
    })(req, res, next);
} 

let authAndVotant = (req, res, next) => {
    passport.authenticate('basic', {session: false}, function(err, user) {
        if (!user) {
            return res.status(401).send({message: 'Username ou password invalide'});
        }
        if (req.params.votantName !== user.name) {
            return res.status(403).send({message: "Vous n'êtes pas le votant que vous essayez de modifier"});
        }

        req.votant = JSON.parse(JSON.stringify(user));
        return next();
    })(req, res, next);
} 


app.get('/api/votants', function (req, res) {
    res.send(votants)
})

app.get('/api/votants/:votantName', function (req, res) {
    let votant = votants.filter((elem) => elem.name === req.params.votantName)
    if (votant.length > 0) {
        res.send(votant[0])
    } else {
        res.sendStatus(404);
    }
})

app.post('/api/votants', function (req, res) {
    if (req.body && req.body.name && req.body.password) {
        let newVotant = req.body;
        if (votants.findIndex(elem => elem.name === newVotant.name) > -1) {
            res.status(400).send("Un votant avec ce nom existe déjà");
        } else {
            votants.push(newVotant);
            res.status(200).send(newVotant)
        }
    } else {
        res.status(400).send("Il manque des champs importants, tels que [name, password]")
    }
})

app.put('/api/votants/:votantName', authAndVotant, function (req, res) {
    if (req.body) {
        let votant = votants.filter((elem) => elem.name === req.params.votantName)
        if (votant.length > 0) {
            let modifiedVotantIndex = votants.findIndex((elem) => elem.name === req.params.votantName);
            let modifiedVotant = votants[modifiedVotantIndex];
            Object.assign(modifiedVotant, req.body);
            if (modifiedVotant.name !== req.params.votantName) {
                votes.forEach((elem) => {
                    if (elem.votant === req.params.votantName) {
                        elem.votant = modifiedVotant.name;
                    }
                })
            }
            res.send(modifiedVotant);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.status(400).send("Il faut mettre un body dans la requête")
    }
})

app.delete('/api/votants/:votantName', authAndVotant, function (req, res) {
    let votant = votants.filter((elem) => elem.name === req.params.votantName)
    if (votant.length > 0) {
        let index = votants.findIndex((elem) => elem.name === req.params.votantName);

        let indexVotesToRemove = 0;
        while (indexVotesToRemove < votes.length) {
            if (votes[indexVotesToRemove].votant === req.params.votantName) {
                votes.splice(indexVotesToRemove, 1);
            } else {
                indexVotesToRemove++;
            }
        }

        votants.splice(index, 1);
        res.sendStatus(201);
    } else {
        res.sendStatus(404);
    }
})

app.get('/api/candidats', function (req, res) {
    res.send(candidats)
})

app.get('/api/candidats/:candidatName', function (req, res) {
    let candidat = candidats.filter((elem) => elem.name === req.params.candidatName)
    if (candidat.length > 0) {
        res.send(candidat[0])
    } else {
        res.sendStatus(404);
    }
})

app.post('/api/candidats', function (req, res) {
    if (req.body && req.body.name && req.body.program) {
        let newCandidat = req.body;
        if (candidats.findIndex(elem => elem.name === newCandidat.name) > -1) {
            res.status(400).send("Un candidat avec ce nom existe déjà");
        } else {
            candidats.push(newCandidat);
            res.status(200).send(newCandidat);
        }
    } else {
        res.status(400).send("Il manque des champs importants, tels que [name, program]")
    }
})

app.put('/api/candidats/:candidatName', function (req, res) {
    if (req.body) {
        let candidat = candidats.filter((elem) => elem.name === req.params.candidatName)
        if (candidat.length > 0) {
            let modifiedCandidatIndex = candidats.findIndex((elem) => elem.name === req.params.candidatName);
            let modifiedCandidat = candidats[modifiedCandidatIndex];
            Object.assign(modifiedCandidat, req.body);
            if (modifiedCandidat.name !== req.params.candidatName) {
                votes.forEach((elem) => {
                    if (elem.candidat === req.params.candidatName) {
                        elem.candidat = modifiedCandidat.name;
                    }
                })
            }
            res.send(modifiedCandidat);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.status(400).send("Il faut mettre un body dans la requête")
    }
})

app.delete('/api/candidats/:candidatName',  function (req, res) {
    let candidat = candidats.filter((elem) => elem.name === req.params.candidatName)
    if (candidat.length > 0) {
        let index = candidats.findIndex((elem) => elem.name === req.params.candidatName);

        let indexVotesToRemove = 0;
        while (indexVotesToRemove < votes.length) {
            if (votes[indexVotesToRemove].candidat === req.params.candidatName) {
                votes.splice(indexVotesToRemove, 1);
            } else {
                indexVotesToRemove++;
            }
        }
        
        candidats.splice(index, 1);
        res.sendStatus(201);
    } else {
        res.sendStatus(404);
    }
})

app.get('/api/votes', function(req, res) {
    let vote = [];
    votes.forEach((elem) => {
        let index = vote.findIndex(elem2 => elem.candidat === elem2.candidat)
        if (index > -1) {
            vote[index].votes += 1;
        } else {
            vote.push({candidat: elem.candidat, votes: 1});
        }
    });
    vote.sort((a, b) => a.votes < b.votes);
    res.send(vote);
});

app.post('/api/votes/:candidatName', authVotant, function(req, res) {
    let candidat = candidats.findIndex((elem) => elem.name === req.params.candidatName);
    let vote = votes.findIndex((elem) => elem.votant === req.votant.name);
    if (candidat > -1) {
        if (vote > -1) {
            votes[vote].candidat = req.params.candidatName;
            res.status(200).send("Vote mis à jour");
        } else {
            votes.push({votant: req.votant.name, candidat: req.params.candidatName});
            res.status(200).send("A voté");
        }
        
    } else {
        res.status(404).send("Il n'y a pas de candidat avec ce nom");
    }

});

 
app.listen(3000, function () {
    console.log('Vote app listening on port 3000')
})