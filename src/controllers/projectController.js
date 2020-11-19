const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const Task = require('../models/task');

const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate(['user', 'tasks']);
    return res.send({ projects });

  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: 'Erro ao carregar a lista!' })
  }
});
router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
    return res.send({ project });

  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: 'Erro ao carregar o projeto!' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, description, tasks } = req.body;
    const project = await Project.create({ title, description, user: req.userId });
    tasks (async task => {
      const projectTask = new Task({ ...task, project: project._id });
      await projectTask.save();

      project.tasks.push(projectTask);

    });
    await project.save();
    return res.send({ project });

  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: 'Erro ao criar um novo projeto!' })
  }
})
router.put('/:projectId', async (req, res) => {
  try {
    const { title, description, tasks } = req.body;
    const project = await Project.findByIdAndUpdate({ title, description }, { new: true });

    project.tasks = [];
    await Task.remove({ project: project._id })

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id });
      await projectTask.save();

      project.tasks.push(projectTask);

    }));
    await project.save();
    return res.send({ project });

  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: 'Erro ao criar um novo projeto!' })
  }
})
router.delete('/:projectId', async (req, res) => {
  try {
    await Project.findByIdAndRemove(req.params.projectId);
    return res.send('removido com sucesso!');

  } catch (err) {
    return res.status(400).send({ error: 'Erro ao remover o projeto!' })
  }
})

module.exports = app => app.use('/projects', router);