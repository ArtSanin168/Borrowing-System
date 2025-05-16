const passport = require("passport")
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt")
const { JWT_SECRET } = require("./config")
const User = require("../models/User")

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
}

passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      // Find the user by ID from JWT payload
      const user = await User.findById(payload.id).select("-password")

      if (!user) {
        return done(null, false)
      }

      return done(null, user)
    } catch (error) {
      return done(error, false)
    }
  }),
)

module.exports = passport
