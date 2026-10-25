
/**
 * Ward inside a given Community Council in a given principal area
 */
export type CommunityWardArea = {
    ward: string;
    community: string;
    area: string;
};

/**
 * Senedd constituency made up of a list of community council ward areas and related metadata
 */
export type Constituency = {
    index: number;
    name: string;
    colour: string;
    areas: CommunityWardArea[];
};
