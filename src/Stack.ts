export default class Stack {
    technologies: string[];
    platform: string;

    constructor(...stack) {
        this.technologies = stack.reduce((acc, tech) => {
            if (!tech) {
                return acc;
            } else if (tech.constructor === Array) {
                return acc.concat(tech);
            } else {
                return acc.concat(tech.split(':'));
            }
        }, []);
        if (this.hasAny('server')) {
            this.platform = 'server';
        } else if (this.hasAny('web')) {
            this.platform = 'web';
        } else if (this.hasAny('android')) {
            this.platform = 'android';
        } else if (this.hasAny('ios')) {
            this.platform = 'ios';
        }
    }

    hasAny(technologies): Boolean {
        const array = technologies.constructor === Array ? technologies : [technologies];
        for (let feature of array) {
            if (this.technologies.indexOf(feature) >= 0) {
                return true;
            }
        }
        return false;
    }

    hasAll(technologies): Boolean {
        const array = technologies.constructor === Array ? technologies : [technologies];
        for (let feature of array) {
            if (this.technologies.indexOf(feature) < 0) {
                return false;
            }
        }
        return true;
    }
}
