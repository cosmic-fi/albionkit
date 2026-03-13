const fs = require('fs');
const path = require('path');

const messagesDir = 'Z:\\Projects\\Apps\\Mvp project\\ao-pocket\\messages';

const files = fs.readdirSync(messagesDir).filter(file => file.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(messagesDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (content.Settings && content.Settings.profile && content.Settings.profile.regions) {
    if (content.UserProfile) {
      content.UserProfile.regions = content.Settings.profile.regions;
      
      // Attempt to reorder properties if necessary, 
      // but standard JSON.stringify will just append it.
      // The requirement says "at the same level as roles".
      // We can try to reconstruct the UserProfile object to place it near roles.
      
      const newUserProfile = {};
      for (const key in content.UserProfile) {
        newUserProfile[key] = content.UserProfile[key];
        if (key === 'roles') {
          // If regions wasn't already added or we want to ensure it's here
          // But it's already added above. Let's do it properly:
        }
      }
      
      // Re-doing the copy to ensure order if possible (though JS objects don't guarantee order, 
      // JSON.stringify usually follows insertion order)
      const roles = content.UserProfile.roles;
      delete content.UserProfile.roles;
      delete content.UserProfile.regions;
      
      content.UserProfile.roles = roles;
      content.UserProfile.regions = content.Settings.profile.regions;
      
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`UserProfile not found in ${file}`);
    }
  } else {
    console.log(`Settings.profile.regions not found in ${file}`);
  }
});
