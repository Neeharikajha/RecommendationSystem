import { createSlice } from "@reduxjs/toolkit";

const Profile = createSlice({
  name: "profile",
  initialState: "neeharika", // Default to Neeharika profile
  reducers: {
    setProfile(state, action) {
      // Accept "neeharika", "new", "custom", or numeric user IDs
      const payload = action.payload;
      if (
        payload === "neeharika" ||
        payload === "new" ||
        payload === "custom" ||
        typeof payload === "number"
      ) {
        return payload;
      }
      return state;
    },
  },
});

export default Profile.reducer;
export const { setProfile } = Profile.actions;
