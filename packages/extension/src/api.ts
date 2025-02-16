import axios from 'axios';
import { WombatOutputChannel } from './wombatOutputChannel.js';
import { CompileResponse } from '../../shared/models/compileResponse.js';

export class API {
    /**
     * Gets all users of the wombat
     */
    public static async getUsers() {
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
    public static async deleteUser(username: string) {
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
    public static async createUser(username: string) {
        let apiUrl: string =
            'http://192.168.125.1:8888/api/projects/users/' + username;

        let apiResult: any = await axios.put(apiUrl);
        if (apiResult.status !== 204) {
            throw new Error('Got response code ' + apiResult.status);
        }
    }

    /**
     * Creates a new project on the wombat
     * @param language the programming language
     * @param username
     * @param projectname
     */
    public static async createProject(
        language: string,
        username: string,
        projectname: string
    ) {
        let apiUrl: string = 'http://192.168.125.1:8888/api/projects';
        let srcFileName: string = '';

        if (language === 'C') {
            srcFileName = 'main.c';
        } else if (language === 'Python') {
            srcFileName = 'main.py';
        } else if (language === 'C++') {
            srcFileName = 'main.cpp';
        }

        let apiData: any = {
            language,
            name: projectname,
            src_file_name: srcFileName,
            user: username,
        };

        let apiResult: any = await axios.post(apiUrl, apiData);
        if (apiResult.status !== 201) {
            throw new Error('Got response code ' + apiResult.status);
        }
    }

    /**
     * Deletes a project from the wombat
     * @param username
     * @param projectname
     */
    public static async deleteProject(username: string, projectname: string) {
        let apiUrl: string =
            'http://192.168.125.1:8888/api/projects/' +
            username +
            '/' +
            projectname;

        let apiResult: any = await axios.delete(apiUrl);
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

    /**
     * Uploads a file to the wombat
     * @param filepath The filepath
     * @param encodedContent The encoded content
     */
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

    /**
     * Creates a file on the wombat fs
     * @param path api dir path
     * @param filename
     */
    public static async createFile(
        path: string,
        filename: string
    ): Promise<void> {
        const apiUrl = 'http://192.168.125.1:8888' + path;
        const apiData = { name: filename, type: 'file', content: '' };

        const apiResult = await axios.post(apiUrl, apiData);
        if (apiResult.status !== 201) {
            throw new Error('Error while trying to create file');
        }
    }

    /**
     * Deletes a file on wombat fs
     * @param path api file path
     */
    public static async deleteFile(path: string) {
        const apiUrl = 'http://192.168.125.1:8888' + path;

        const apiResult = await axios.delete(apiUrl);
        if (apiResult.status !== 204) {
            throw new Error('Error while trying to delete file');
        }
    }

    /**
     * Compile a wombat project
     * @param username
     * @param projectname
     */
    public static async compileProject(username: string, projectname: string) {
        let apiUrl: string = 'http://192.168.125.1:8888/api/compile';
        let apiData: any = {
            name: projectname,
            user: username,
        };

        let apiResult = await axios.post(apiUrl, apiData);
        if (apiResult.status !== 200) {
            throw new Error('Got response code ' + apiResult.status);
        }

        const data = apiResult.data as CompileResponse;

        if (data.result.error !== null) {
            return `Compilation failed\n${data.result.stderr}`;
        } else if (
            data.result.stderr !== null &&
            data.result.stderr.length > 0
        ) {
            return (
                `Compilation succeeded with warning(s)\n${data.result.stderr}` +
                (data.result.stdout.length > 0 ? `\n${data.result.stdout}` : '')
            );
        } else {
            return (
                'Compilation succeeded' +
                (data.result.stdout.length > 0 ? `\n${data.result.stdout}` : '')
            );
        }
    }

    /**
     * Run a wombat project
     * @param username
     * @param projectname
     */
    public static async runProject(username: string, projectname: string) {
        let apiUrl: string = 'http://192.168.125.1:8888/api/run';
        let apiData: any = {
            name: projectname,
            user: username,
        };

        let apiResult = await axios.post(apiUrl, apiData, {
            validateStatus: (status) =>
                (status >= 200 && status < 300) || status === 409,
        });

        if (apiResult.status === 409) {
            throw new Error('Program is already running!');
        } else if (![200, 201, 204].includes(apiResult.status)) {
            throw new Error('Got response code ' + apiResult.status);
        } else {
            WombatOutputChannel.showAndClearWombatOutputChannel();
        }
    }

    /**
     * Stop a wombat project
     */
    public static async stopProject() {
        let apiUrl: string = 'http://192.168.125.1:8888/api/run/current';

        let apiResult = await axios.delete(apiUrl);

        if (apiResult.status !== 200) {
            throw new Error('Got response code ' + apiResult.status);
        }
    }
}
