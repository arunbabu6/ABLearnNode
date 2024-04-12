const ClientRequest = require("../models/ClientRequest");
const GrantsAll = require("../models/GrantSchema");
const AdminGrantRequests = require("../models/GrantSchema");
const OnBoardUser = require("../models/OnBoardUser");

/**
 * Creates a new client request.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const createClientRequest = async (req, res) => {
  const { granterName, username, email, description, requestedAmount } =
    req.body;

  try {
    const existingRequest = await ClientRequest.findOne({ granterName, email });
    if (existingRequest) {
      return res
        .status(400)
        .json({
          error: "Cannot request with the same granter and email again.",
        });
    }

    const newClientRequest = new ClientRequest({
      granterName,
      username,
      email,
      description,
      requestedAmount,
      grantStatus: "Pending",
    });

    const savedClientRequest = await newClientRequest.save();

    res.status(201).json(savedClientRequest);
  } catch (error) {
    console.error("Error creating user request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Retrieves all grants.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const getAllGrants = async (req, res) => {
  const allData = await GrantsAll.find();
  res.send(allData);
};

/**
 * Retrieves all grants.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const GetUserForAdmin = async (req, res) => {
  const allData = await OnBoardUser.find();
  res.send(allData);
};

/**
 * Retrieves all client requests.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */

const getAllClientRequest = async (req, res) => {
  const allData = await ClientRequest.find();
  res.send(allData);
};

/**
 * Retrieves client requests for a specific user.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */

const getUserGrantRequest = async (req, res) => {
  const { email } = req.query;
  try {
    const userGrantRequests = await ClientRequest.find({ email: email });
    res.send(userGrantRequests);
  } catch (error) {
    console.error("Error fetching user grant requests:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Retrieves client requests for a specific user.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */

const OnBoardNewUser = async (req, res) => {
  const { role, username, email, picture } = req.body;
  const existingUser = await OnBoardUser.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }
  try {
    const onBoardUser = new OnBoardUser({
      role,
      username,
      email,
      picture,
    });

    const onBoardNewUser = await onBoardUser.save();

    res.status(201).json(onBoardNewUser);
  } catch (error) {
    console.error("Error on boarding the user request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const AdminDecision = async (req, res) => {
  const { id, granterName, email, grantStatus } = req.body;
  console.log(id);
  try {
    // Find the user by ID
    ClientRequest.findById(id)
      .then((user) => {
        if (!user) {
          console.log("User not found.");
          return res.status(404).json({ error: "User not found" });
        }
        // If the user is found, update the grantStatus
        user.granterName = granterName;
        user.email = email;
        user.grantStatus = grantStatus;
        return user.save();
      })
      .then((updatedUser) => {
        console.log("Updated user:", updatedUser);
        res.status(201).json(updatedUser);
      })
      .catch((error) => {
        console.error("Error updating user:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (error) {
    console.error("Error on boarding the user request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createClientRequest,
  getAllGrants,
  getAllClientRequest,
  getUserGrantRequest,
  OnBoardNewUser,
  AdminDecision,
  GetUserForAdmin
};
