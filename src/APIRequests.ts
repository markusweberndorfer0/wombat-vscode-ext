import axios from 'axios';

export class APIRequests {
    /**
     * Gets all users of the wombat
     */
    public static async getUsers(): Promise<any> {
        let apiUri: string = 'http://192.168.125.1:8888/api/projects/users';

        let apiResult: any = await axios.get(apiUri);
        if (apiResult.status === 200) {
            return apiResult.data;
        }
        throw new Error('Got response code ' + apiResult.status);
    }

    /**
     * Deletes a user on the wombat
     * @param username
     */
    public static async deleteUser(username: string): Promise<void> {
        let apiUrl: string =
            'http://192.168.125.1:8888/api/projects/users/' + username;

        let apiResult: any = await axios.delete(apiUrl);
        if (apiResult.status !== 204) {
            throw new Error('Got response code ' + apiResult.status);
        }
    }

    /**
     * Creates a new user on the wombat
     * @param username
     */
    public static async createUser(username: string): Promise<void> {
        let apiUrl: string =
            'http://192.168.125.1:8888/api/projects/users/' + username;

        let apiResult: any = await axios.put(apiUrl);
        if (apiResult.status !== 204) {
            throw new Error('Got response code ' + apiResult.status);
        }
    }

    /**
     * Gets all the projects of a wombat user
     * @param username
     * @returns The data of all the projects
     */
    public static async getProjects(username: string) {
        let apiUrl: string =
            'http://192.168.125.1:8888/api/projects/' + username;

        let apiResult: any = await axios.get(apiUrl);
        if (apiResult.status === 200) {
            return apiResult.data;
        }
        throw new Error('Got response code ' + apiResult.status);
    }

    /**
     * Gets the project information about a single project on the wombat
     * @param username
     * @param projectname
     * @returns The project data
     */
    public static async getProject(username: string, projectname: string) {
        let apiUrl: string =
            'http://192.168.125.1:8888/api/projects/' +
            username +
            '/' +
            projectname;

        let apiResult: any = await axios.get(apiUrl);
        if (apiResult.status === 200) {
            return apiResult.data;
        }
        throw new Error('Got response code ' + apiResult.status);
    }

    /**
     * Get a file from the wombat api
     * @param filepath
     * @returns the file data
     */
    public static async getFile(filepath: string) {
        let apiUrl: string = 'http://192.168.125.1:8888/api/fs' + filepath;

        let apiResult: any = await axios.get(apiUrl);
        if (apiResult.status === 200) {
            return apiResult.data;
        }
        throw new Error('Got response code ' + apiResult.status);
    }

    public static async putFile(filepath: string, encodedContent: string) {
        let apiUrl: string = 'http://192.168.125.1:8888/api/fs' + filepath;
        let apiData: any = {
            content: encodedContent,
            encoding: 'ascii',
        };

        let apiResult: any = await axios.put(apiUrl, apiData);
        if (apiResult.status !== 204) {
            throw new Error('Got response code ' + apiResult.status);
        }
    }
}
