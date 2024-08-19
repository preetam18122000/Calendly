const express= require('express');
const router = express.Router();
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Schedule = require('../models/scheduleModel');
const isAuthenticated = require('../middlewares/auth');
const { validateEmail } = require('../utils/validators');

router.post('/create', async (req, res) => {
    //not using isAuthenticated here as anyone can create an event without being a user in db
    try {
        const {
            menteeEmail,
            mentorId,
            schedule,
            title,
            description,
            day,
            start,
            end
        } = req.body;

        if( !validateEmail(menteeEmail)){
            return res.status(400).json({ err: "Invalid email"});
        }

        const foundUser = await User.findbyId(mentorId);
        if(!foundUser){
            return res.status(404).json({ err: "mentor not found"});
        }

        const foundSchedule = await Schedule.findbyId(schedule);
        if(!foundSchedule){
            //user has not set his availability for the asked time
            return res.status(400).json({ err: 'No availability set by the mentor'});
        }

        if(start < foundSchedule.dayStart || end > foundSchedule.dayEnd){
            return res.status(400).json({ err: 'Mentor is not available for the asked time slots'});
        }

        //check for clashing meetings of the mentee
        const foundClashingMenteeEvent = await Event.findOne({
            menteeEmail,
            day,
            start: { $lte: end},
            end: { $gte: start}
        });
        if(foundClashingMenteeEvent) {
            return res.status(400).json({ err: 'You already have a meeting scheduled for this time slot'});
        }

        //check for clashing meetings of the mentor
        const foundClashingMentorEvent = await Event.findOne({
            mentorId,
            day,
            start: { $lte: end},
            end: { $gte: start}
        });
        if(foundClashingMentorEvent) {
            return res.status(400).json({ err: 'Mentor has a meeting scheduled for this time slot'});
        }

        const newEvent = new Event({
            menteeEmail,
            mentorId,
            schedule,
            title,
            description,
            day,
            start,
            end
        });
        await newEvent.save();

        foundUser.events.push(newEvent);
        await foundUser.save();

        foundSchedule.events.push(newEvent);
        await foundSchedule.save();

        return res.status(201).json(newEvent);
    } catch ( error ) {
        console.log('Error in create event API: ', error);
        return res.status(403).json({err: error.message });
    }
})


router.get('/get/:eventId', async (req, res) => {
    try {
        const foundEvent = await Event.findById(req.params.eventId);
        if(!foundEvent){
            return res.status(404).json({ err: 'No event found'});
        }
        return res.status(200).json(foundEvent);
    } catch ( error ) {
        console.log('Error in get event API: ', error);
        return res.status(403).json({err: error.message });
    }
})

router.delete('/delete/:eventId', isAuthenticated, async (req, res) => {
    //using isAuthenticated here as only the mentor should delete the events
    try {
        const foundEvent = await Event.findById(req.params.eventId);
        if(!foundEvent){
            return res.status(404).json({ err: 'No event found'});
        }

        const foundUser = await User.findById(req.user.id);
        if(!foundUser){
            return res.status(400).json({ err: 'User not found'});
        }

        const foundSchedule = await Schedule.findById(foundEvent.schedule);
        if(!foundSchedule){
            return res.status(400).json({ err: 'Schedule not found'});
        }

        foundUser.events.pull(foundEvent);
        await foundUser.save();

        foundSchedule.events.pull(foundEvent);
        await foundSchedule.save();

        await foundEvent.delete();
        
        return res.status(200).json({ msg: 'Event deleted successfully'});
    } catch ( error ) {
        console.log('Error in delete event API: ', error);
        return res.status(403).json({err: error.message });
    }
})

module.exports = router;