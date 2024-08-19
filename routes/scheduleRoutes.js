//create, get, update and delete schedule -> 4 routes needed

const express = require('express');
const router= express.Router();
const isAuthenticated = require('../middlewares/auth');

const Schedule = require('../models/scheduleModel');
const User = require('../models/userModel');


router.post("/create", isAuthenticated, async (req, res) => {
    try {
        const { day, dayStart, dayEnd, eventDuration } = req.body;
        const user = req.user.id;
        const foundUser = await User.findById(user);

        if(!foundUser){
            return res.status(404).json({ err: "User not found" });
        }
        const presentSchedule = await Schedule.findOne({ user, day });
        if(presentSchedule){
            return res.status(403).json({ err: "Schedule already exist" });
        }

        const newSchedule = new Schedule({
            user,
            day,
            dayStart,
            dayEnd,
            eventDuration
        })
        await newSchedule.save();
        foundUser.schedules.push(newSchedule); //in user model, we will push newly created schedule
        await foundUser.save();

        return res.status(200).json(newSchedule);
    } catch (error){
        return res.status(500).json({ err: error});
    }
})

router.get("/get/:scheduleId", async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId);
        if(!foundUser){
            return res.status(404).json({ err: "User not found"});
        }
        const schedule = await Schedule.find({ user: req.params.id });
        res.status(200).json(schedule);
    } catch (error) {
        return res.status(500).json({ err: error});
    }
})




module.exports = router;

