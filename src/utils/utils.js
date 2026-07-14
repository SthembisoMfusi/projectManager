
export function cleanData(data, included = []) {
    let rawDescription = data.attributes?.body ? data.attributes.body.value : "";
    let cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').trim();

    const getIncludedUser = (userId) => {
        const user = included.find(item => item.id === userId);
        if (!user) return null;
       
        const userName = user.attributes?.display_name || user.attributes?.name || "Unknown User";
        return { id: user.id, name: userName };
    };

    let manager = null;
   
    if (data.relationships?.field_manager?.data?.id) {
        manager = getIncludedUser(data.relationships.field_manager.data.id);
    }

    let teamMembers = [];
    // Safely check if team members exist
    if (data.relationships?.field_team_members?.data) {
        
        const membersArray = Array.isArray(data.relationships.field_team_members.data) 
            ? data.relationships.field_team_members.data 
            : [data.relationships.field_team_members.data];

        teamMembers = membersArray.map(member => {
            return getIncludedUser(member.id);
        }).filter(Boolean); // Remove any nulls
    }

    console.log(`Matching completed for ${data.attributes.title} -> Manager:`, manager?.name || "None");

    return {
        id: data.id,
        title: data.attributes.title,
        description: cleanDescription,
        status: data.attributes.field_status,
        manager: manager,
        teamMembers: teamMembers
    }
}

export function cleanUser(data) {
    
    let roles = [];
    if (data.relationships?.roles?.data) {
        
        const rolesArray = Array.isArray(data.relationships.roles.data) 
            ? data.relationships.roles.data 
            : [data.relationships.roles.data];
        roles = rolesArray.map(role => {
            return role.meta?.drupal_internal__target_id;
        }).filter(Boolean);
    }

    return {
        id: data.id,
        name: data.attributes?.display_name || data.attributes?.name || "Unknown User",
        email: data.attributes?.mail || "",
        isActive: data.attributes?.status, 
        roles: roles 
    };
}

export const getAuthHeaders = (request) => {
    const headers = {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
    };

    if (request.headers.authorization) {
        headers['Authorization'] = request.headers.authorization;
    }
    return headers;
}