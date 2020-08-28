/**
 * @type {XBoxOne360ControllerOptions[]}
 */
const defaultControllerProfilesXBox = [{
    profileName: "Default"
}, {
    profileName: "Default (Dark)",
    colorCase: "#454545"
}]

/**
 * The default user profile if no default user profiles are available
 */
const defaultControllerProfile = {
    profileName: "Default"
}

/**
 * Check if for an id there is already a value in the local storage.
 * If not return the default value and add an entry with this value.
 * If yes return the existing value instead of the default value.
 * @param {string} id The local storage entry id
 * @param {any} defaultValue The default value
 * @param {{jsonParseLocalStorageValue?: boolean;jsonStringifyDefaultValue?: boolean}} options
 */
const checkAndSetLocalStorageForId = (id, defaultValue, options = {}) => {
    const localStorageValue = localStorage.getItem(id)
    if (localStorageValue !== null && localStorageValue !== undefined) {
        return options.jsonParseLocalStorageValue === true ? JSON.parse(localStorageValue) : localStorageValue
    } else {
        localStorage.setItem(id, options.jsonStringifyDefaultValue ? JSON.stringify(defaultValue) : defaultValue)
    }
    return defaultValue
}

/**
 * @typedef {{profileName?: string; [key: string]: any}} UserProfile
 */
class UserProfileManager {
    /**
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile The visualization profile
     */
    static getUserProfileIdBase(gamepadVisualizationProfile) {
        return `gamepadVisualizationUserProfiles-${gamepadVisualizationProfile.profileName}`
    }

    /**
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile The visualization profile
     */
    static getUserProfilesId(gamepadVisualizationProfile) {
        return `${this.getUserProfileIdBase(gamepadVisualizationProfile)}-profiles`
    }

    /**
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile The visualization profile
     */
    static getUserProfilesIdLastUsed(gamepadVisualizationProfile) {
        return `${this.getUserProfileIdBase(gamepadVisualizationProfile)}-last-used`
    }

    /**
     * Get a gamepad visualization user profile from the local storage
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile The visualization profile
     * @returns {UserProfile[]}
     */
    static getUserProfiles(gamepadVisualizationProfile) {
        /** @type {UserProfile[]} */
        const defaultProfileValue = []
        if (gamepadVisualizationProfile.profileName === new XBoxOne360ControllerChromium().profileName
            || gamepadVisualizationProfile.profileName === new XBoxOne360ControllerFirefox().profileName) {
            defaultProfileValue.push(...defaultControllerProfilesXBox)
        } else {
            defaultProfileValue.push(defaultControllerProfile)
        }
        const idUserProfiles = this.getUserProfilesId(gamepadVisualizationProfile)
        /** @type {UserProfile[]} */
        const parsedUserProfiles = checkAndSetLocalStorageForId(idUserProfiles, defaultProfileValue, {
            jsonParseLocalStorageValue: true,
            jsonStringifyDefaultValue: true
        })
        // Catch corrupted database entries and overwrite them with the default value
        if (!Array.isArray(parsedUserProfiles) || parsedUserProfiles.length === 0) {
            console.warn("The user profile storage was corrupt")
            localStorage.setItem(idUserProfiles, JSON.stringify(defaultProfileValue))
            return defaultProfileValue
        }
        return parsedUserProfiles
    }

    /**
     * Add or update a gamepad visualization user profile in the local storage
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
     * @param {UserProfile} userProfile
     * @returns {boolean} Indicate if an update necessary
     */
    static addOrUpdateUserProfiles(gamepadVisualizationProfile, userProfile) {
        if (globalDebug) {
            console.debug("addOrUpdateUserProfiles", { gamepadVisualizationProfile, userProfile })
        }
        let updateNecessary = false
        const userProfiles = this.getUserProfiles(gamepadVisualizationProfile)
        // If user profile is a "default" update name so that defaults are never changed
        if (userProfile.profileName === "Default") {
            userProfile.profileName = "Default (Customized)"
            updateNecessary = true
            if (globalDebug) {
                console.debug("addOrUpdateUserProfiles", { customized1: userProfile.profileName })
            }
        } else if (gamepadVisualizationProfile.profileName === new XBoxOne360ControllerChromium().profileName
            || gamepadVisualizationProfile.profileName === new XBoxOne360ControllerFirefox().profileName) {
            const existingDefaultProfile = defaultControllerProfilesXBox.find(a => a.profileName === userProfile.profileName)
            if (existingDefaultProfile !== undefined) {
                userProfile.profileName = `${existingDefaultProfile.profileName} (Customized)`
                updateNecessary = true
                if (globalDebug) {
                    console.debug("addOrUpdateUserProfiles", { existingDefaultProfile, customized2: userProfile.profileName })
                }
            }
        }
        // Check if profile already exists and if yes overwrite otherwise just add
        let index = userProfiles.findIndex(a => a.profileName === userProfile.profileName)
        if (index > -1) {
            userProfiles[index] = userProfile
        } else {
            userProfiles.push(userProfile)
        }
        const idUserProfiles = this.getUserProfilesId(gamepadVisualizationProfile)
        const idUserProfilesLastUsed = this.getUserProfilesIdLastUsed(gamepadVisualizationProfile)
        localStorage.setItem(idUserProfiles, JSON.stringify(userProfiles))
        localStorage.setItem(idUserProfilesLastUsed, userProfile.profileName)
        return updateNecessary
    }

    /**
     * Remove a gamepad visualization user profile from the local storage
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
     * @param {UserProfile} userProfile
     */
    static removeUserProfile(gamepadVisualizationProfile, userProfile) {
        const userProfiles = this.getUserProfiles(gamepadVisualizationProfile)
        // Check if it is a default profile
        if (userProfile.profileName === "Default") {
            console.warn(`The user tried to reset a default user profile: "${userProfile.profileName}"`)
            return
        } else if (gamepadVisualizationProfile.profileName === new XBoxOne360ControllerChromium().profileName
            || gamepadVisualizationProfile.profileName === new XBoxOne360ControllerFirefox().profileName) {
            const existingDefaultProfile = defaultControllerProfilesXBox.find(a => a.profileName === userProfile.profileName)
            if (existingDefaultProfile !== undefined) {
                console.warn(`The user tried to reset a default user profile: "${userProfile.profileName}"`)
                return
            }
        }
        // Check if profile already exists and if yes overwrite otherwise just add
        let index = userProfiles.findIndex(a => a.name === userProfile.profileName)
        if (index > -1) {
            userProfiles.splice(index, 1)
            const idUserProfiles = this.getUserProfilesId(gamepadVisualizationProfile)
            const idUserProfilesLastUsed = this.getUserProfilesIdLastUsed(gamepadVisualizationProfile)
            localStorage.setItem(idUserProfiles, JSON.stringify(userProfiles))
            localStorage.removeItem(idUserProfilesLastUsed)
        }
    }

    /**
     * Get a gamepad visualization user profile from the local storage
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
     * @param {string} userProfileName
     * @returns {UserProfile|undefined}
     */
    static getUserProfile (gamepadVisualizationProfile, userProfileName = undefined) {
        const userProfiles = this.getUserProfiles(gamepadVisualizationProfile)
        // If no profile name is provided select a default profile name
        if (userProfileName === undefined || userProfileName === null) {
            if (gamepadVisualizationProfile.profileName === new XBoxOne360ControllerChromium().profileName
                || gamepadVisualizationProfile.profileName === new XBoxOne360ControllerFirefox().profileName) {
                    userProfileName = defaultControllerProfilesXBox[0].profileName
            } else {
                userProfileName = defaultControllerProfile.profileName
            }
        }
        if (globalDebug) {
            console.debug("getUserProfile", { gamepadVisualizationProfile, userProfileName, userProfiles })
        }
        if (userProfiles.length > 0) {
            // Otherwise check if profile already exists and if yes overwrite otherwise just add
            let index = userProfiles.findIndex(a => a.profileName === userProfileName)
            if (index > -1) {
                const idUserProfilesLastUsed = this.getUserProfilesIdLastUsed(gamepadVisualizationProfile)
                localStorage.setItem(idUserProfilesLastUsed, userProfiles[index].profileName)

                return userProfiles[index]
            }
        }
        console.warn(`A user profile was not found: "${userProfileName}"`)
        return undefined
    }

    /**
     * Get a gamepad visualization user profile from the local storage that was used last
     * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
     * @returns {UserProfile|undefined}
     */
    static getUserProfileLastUsed (gamepadVisualizationProfile) {
        const idUserProfilesLastUsed = this.getUserProfilesIdLastUsed(gamepadVisualizationProfile)
        const lastUsedUserProfileName = localStorage.getItem(idUserProfilesLastUsed)
        return this.getUserProfile(gamepadVisualizationProfile, lastUsedUserProfileName)
    }
}
