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
        //converting 9:30 to 9.30, so that we can easily use less than and greater than sign
        const scheduleStart = Number(dayStart.replace(":", "."));
        const scheduleEnd = Number(dayEnd.replace(":", "."));

        const newSchedule = new Schedule({
            user,
            day,
            dayStart: scheduleStart,
            dayEnd: scheduleEnd,
            eventDuration
        })
        await newSchedule.save();
        foundUser.schedules.push(newSchedule); //in user model, we will push newly created schedule
        await foundUser.save();

        return res.status(201).json(newSchedule);
    } catch (error){
        console.log('Error in create schedule API: ', error);
        return res.status(500).json({ err: error.message});
    }
})

router.get("/get/:userId", async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId);
        if(!foundUser){
            return res.status(404).json({ err: "User not found"});
        }
        const schedule = await Schedule.find({ user: req.params.userId });
        res.status(200).json(schedule);
    } catch (error) {
        return res.status(500).json({ err: error.message });
    }
})

router.put("/update/:scheduleId", isAuthenticated, async (req, res) => {
    try {
        const foundSchedule = await Schedule.findById(req.params.scheduleId);

        if(!foundSchedule) {
            return res.status(404).json({ err: "Schedule not found"});
        }
        if(foundSchedule.events.length > 0){
            //this time slot already have some events scheduled against it, so we can't delete this schedule
            return res.status(403).json({ err: "Cannot update schedule with events"}); 
        }

        const { day, dayStart, dayEnd, eventDuration } = req.body;

        const scheduleStart = Number(dayStart.replace(":", "."));
        const scheduleEnd = Number(dayEnd.replace(":", "."));

        const updateSchedule = await Schedule.updateOne(
            { _id: req.params.scheduleId },
            { day, dayStart: scheduleStart, dayEnd: scheduleEnd, eventDuration}
        );
        res.status(200).json(updateSchedule);
        } catch (error) {
        console.log("Error in update schedule API: ", error);
        res.status(500).json({ err: error.message });
    }
})

router.delete("/deleted/:scheduleId", isAuthenticated, async(req, res) => {
    try {
        const foundUser = await User.findById(req.user.id);
        if(!foundUser){
            return res.status(404).json({ err: "User not found"});
        }
        const foundSchedule = await Schedule.findById(req.params.scheduleId);
        if(!foundSchedule){
            return res.status(404).json({ err: "Schedule not found"});
        }
        if(foundSchedule.events.length > 0){
            return res.status(403).json({ err: "Cannot delete schedule with events"});
        }

        await Schedule.findByIdAndDelete(req.params.scheduleId);
        foundUser.schedules.pull(req.params.scheduleId); //a pull operator provided by mongo db which will remove the particular id
        await foundUser.save();
        res.status(200).json({ msg: "Schedule deleted"});
    } catch (error) {
        console.log('Error in delete schedule API: ', error);
        res.status(403).json({ err: error.message});
    }
})

module.exports = router;

