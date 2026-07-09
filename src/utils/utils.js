export function cleanData(data){
    let rawDescription = data.attributes.body? data.attributes.body.value : "";
    let cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').trim();
    return {
        id: data.id,
        title: data.attributes.title,
        description: cleanDescription,
        status: data.attributes.field_status
    }
}