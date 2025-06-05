import express from 'express';
import { getEmbed, getChat } from '../controllers/api.controller.js';


const Router = express.Router();

Router.post("/embed", getEmbed);
Router.post("/chat", getChat); 

export default Router;
// async function getEmbed(req, res) {