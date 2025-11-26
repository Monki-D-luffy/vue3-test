// mock-server/utils.js

export const getNowString = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
};

export const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toISOString().replace('T', ' ').substring(0, 19);
};

export const isTimeAfter = (t1, t2) => {
    return new Date(t1).getTime() > new Date(t2).getTime();
};