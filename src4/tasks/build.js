/**
 * Typescript build task for Akra 3D engine.
 */

'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var xml2js = require('xml2js');
var wrench = require('wrench');

//zip for resource compression
var Zip = require('node-zip');


var TYPESCRIPT = "typescript-0.9.5";

//TODO: add all available TS options

module.exports = function (grunt) {
    /**
     * @param moduleName {String} Имя собираемого в данный момент модуля
     * @param sourcePaths {String[]} Файлы из которых будет собран модуль.
     * @param dest {String} Файл в который будет скомпилирован модуль
     * @param options {Object} Опции сборки.
     */
    function compile(moduleName, sourcePaths, dest, options, cb) {

        var filteredPaths = sourcePaths.filter(function (path) {
            if (!grunt.file.exists(path)) {
                grunt.log.warn('Source file "' + path + '" not found.');
                return false;
            } else {
                return true;
            }
        });

        /**
         * 0 - none minimizing, 1 - simple optimization, 2 - advanced optimiztion
        */
        var minimizationLevel = 0;
        if (grunt.option("min_level") && grunt.option("min_level") > 0) {
            minimizationLevel = grunt.option("min_level");
        }
        else if (grunt.option("minimize")) {
            minimizationLevel = 2;
        }
        else if (options.min_level > 0) {
            minimizationLevel = options.min_level;
        }

        var tsBin = "";
        if (options.tscc || grunt.option("tscc") || minimizationLevel > 0) {
            tsBin = path.normalize(__dirname + '/tscc/tscc.js');
        }
        else {
            tsBin = path.normalize(__dirname + "/" + TYPESCRIPT + "/tsc.js");
        }

        var argv = [tsBin].concat(sourcePaths);

        if (options.target) {
            argv.push("--target", options.target);
        }

        if (options.module) {
            argv.push("--module", options.module);
        }

        if (options.sourceMap) {
            argv.push("--sourcemap");
        }

        if (options.declaration) {
            argv.push("--declaration");
        }

        if (options.propagateEnumConstants) {
            argv.push("--propagateEnumConstants");
        }

        if (dest) {
            argv.push("--out", dest);
        }

        var cmd = "node";

        grunt.log.writeln(cmd + " " + argv.join(" "));

        var tsc = spawn(cmd, argv);

        tsc.stdout.on("data", function (data) {
            grunt.log.write(data.toString());
        });

        tsc.stderr.on("data", function (data) {
            grunt.log.error(data.toString());
        });

        tsc.on("close", function (code) {
            if (code === 0) {
                searchResources(moduleName, sourcePaths, dest, options, function () {
                    if (minimizationLevel > 0) {
                        minimize(dest, minimizationLevel, cb);
                    }
                    else {
                        cb(true);
                    }
                });
            }
            else {
                grunt.log.error(new Error("Compilation failed."));
                cb(false);
            }
        });
    }

    /**
     * create zip archive with files described in {argv}
     * @param folder {String} Path to folde with resource.xml
     * @param mapFile {String} Path to .map file.
     * @param additionalData {String[]} Дополнительные файлы и папки которые надо включить в архив с ресурсом.
     */
    function packResourcesArchive(folder, map, additionalData) {
        var archive = new Zip();
        var files = [];             // файлы которые были добавлены в архив

        archive.file(".map", JSON.stringify(map));

        grunt.log.debug("\t [add file]", ".map");

        while (map) {
            if (map.files) {
                for (var i = 0; i < map.files.length; i++) {
                    var file = map.files[i].path;
                    var res = file.replace(/\\/ig, "/");
                    archive.file(res, fs.readFileSync(path.join(folder, file)).toString('base64'), { base64: true });
                    grunt.log.debug("\t [add file]", res);
                }
            }

            map = map.deps;
        }

        if (additionalData) {
            additionalData.forEach(function (value, i) {
                value = path.join(folder, value);
                var name = path.relative(folder, value).replace(/\\/ig, "/");

                if (fs.existsSync(value)) {
                    if (fs.statSync(value).isDirectory()) {
                        //files in string[] array, include directories..
                        var files = wrench.readdirSyncRecursive(value);
                        grunt.fail.warn("TODO: folder support not implemented....");
                    }
                    else if (Object.keys(archive.files).indexOf(name) === -1) {
                        archive.file(name, fs.readFileSync(value).toString('base64'), { base64: true });
                        grunt.log.debug("\t [add file]", name);
                    }
                }
                else {
                    grunt.fail.warn("\t [could not find file] " + value + " (cwd: " + process.cwd() + ")");
                }
            });
        }

        //return "data:application/octet-stream;base64," + archive.generate({ base64: true, compression: 'DEFLATE' });
        return archive;
    }

    function getLowerLevel(deps) {
        var c = deps;

        while (c) {
            if (!c.deps) {
                return c;
            }

            c = c.deps;
        }

        return c;
    }

    /**
     * Загружаем ресурс из тега Resource в map файл.
     * @param Resource {XML} Resource tag.
     * @param cur {IDependens} Текущий уровень зависимостей.
     */
    function loadResource(Resource, cur) {
        cur.files = cur.files || [];

        var res = { path: Resource.$.Path };

        if (Resource.$.Name) {
            res.name = Resource.$.Name;
        }

        if (Resource.$.Comment) {
            res.comment = Resource.$.Comment;
        }

        if (Resource.$.Type) {
            res.type = Resource.$.Type;
        }

        cur.files.push(res);

        if (Resource.Resource) {
            cur.deps = cur.deps || {};

            for (var i = 0; i < Resource.Resource.length; ++i) {
                loadResource(Resource.Resource[i], cur.deps);
            }
        }
    }

    /**
     * @param resourceName {String} Resource name.
     * @param resourcePath {String} Path to folder with resources.xml.
     * @param PropertyGroup {XML} Xml tag with resource sedcription.
     * @param destFolder {String} Destination folder.
     */
    function crateResourceObject(resourceName, resourcePath, PropertyGroup, destFolder) {
        var isArchive = false;
        var useInlining = false;
        var outDir = "";
        var mapFile = null;
        var map = null;

        if (PropertyGroup.UseInlining) {
            isArchive = PropertyGroup.Archive[0].toLowerCase() === "true";

            //При подстановке внутрь скрипта все должно быть запаковано в один файл.
            if (useInlining) {
                isArchive = true;
            }
        }

        if (!useInlining) {
            //при использовании подстановки, контент включается внутрь JS файла
            //поэтому нету смысла использовать параметр OutDir
            if (PropertyGroup.OutDir) {
                outDir = PropertyGroup.OutDir[0];
            }

            if (PropertyGroup.Archive) {
                isArchive = PropertyGroup.Archive[0].toLowerCase() === "true";
            }
        }

        if (PropertyGroup.MapFile) {
            mapFile = PropertyGroup.MapFile[0];
            //расчитаем полный путь к map файлу
            mapFile = path.join(resourcePath, mapFile);

            if (!fs.existsSync(mapFile)) {
                grunt.fail.warn("<MapFile>" + mapFile + "</MapFile> not found.");
            }
        }
        
        if (mapFile) {
            map = JSON.parse(fs.readFileSync(mapFile), "utf8");

            var mapFolder = path.dirname(mapFile);

            var p = map;
            while (p) {
                if (p.files) {
                    for (var i = 0; i < p.files.length; i++) {
                        p.files[i].path = path.normalize(mapFolder + "/" + p.files[i].path).replace(/\\/ig, "/");
                    }
                }

                p = p.deps;
            }
        }
        else {
            map = { files: [] };
        }

        if (PropertyGroup.Data) {
            var Data = PropertyGroup.Data[0];
            var additionalFiles = [];

            if (Data.Folder) {
                for (var i = 0; i < Data.Folder.length; ++i) {
                    var currentFolder = path.join(resourcePath, Data.Folder[i].$.Path);
                    var files = wrench.readdirSyncRecursive(currentFolder);
                    var excludes = Data.Folder[i].Exclude;

                    if (excludes) {
                        for (var f = 0; f < files.length; ++f) {
                            for (var n = 0; n < excludes.length; ++n) {
                                if (path.resolve(path.join(currentFolder, excludes[n].$.Path)) == path.resolve(path.join(currentFolder, files[f]))) {
                                    //Removing Exclude from files.
                                    grunt.log.debug("Excluding file: ", excludes[n].$.Path);
                                    files.splice(f, 1);
                                    f--;
                                }
                            }
                        }
                    }

                    files.forEach(function (file, i) {
                        additionalFiles.push(path.relative(resourcePath, path.join(currentFolder, file)));
                    });
                }
            }

            if (Data.File) {
                for (var i = 0; i < Data.File.length; ++i) {
                    additionalFiles.push(path.normalize(Data.File[i].$.Path));
                }
            }

            if (Data.Resource) {
                /**
                 * @param Resource {XML} Current resource.
                 * @param cur {IDependence} Current dep level.
                 */

                var lowLevel = getLowerLevel(map);

                for (var i = 0; i < Data.Resource.length; ++i) {
                    loadResource(Data.Resource[i], lowLevel);
                }
            }
        }
        
        if (isArchive) {
            var archive = packResourcesArchive(resourcePath, map, additionalFiles);

            if (useInlining) {
                return "data:application/octet-stream;base64," + archive.generate({ base64: true, compression: 'DEFLATE' });
            }
            else {
                var outputFile = path.join(destFolder, outDir, resourceName + ".ara");
                wrench.mkdirSyncRecursive(path.dirname(outputFile));

                var archiveData = archive.generate({ base64: false, compression: 'DEFLATE' });

                fs.writeFileSync(outputFile, archiveData, 'binary');
                return path.relative(destFolder, outputFile).replace(/\\/ig, "/");
            }       
        }

        // Записываем все файлы из map & additionalFiles в srcFiles
        // после чего записываем srcFiles в outputDir

        var srcFiles = additionalFiles.slice(0);
        var outputDir = path.join(destFolder, outDir);

        wrench.mkdirSyncRecursive(outputDir);

        var p = map;
        while (p) {
            if (p.files) {
                for (var i = 0; i < p.files.length; i++) {
                    if (srcFiles.indexOf(p.files[i].path) == -1) {
                        srcFiles.push(p.files[i].path);
                    }
                    
                }
            }

            p = p.deps;
        }

        for (var i = 0; i < srcFiles.length; ++i) {
            var dstFile = path.join(outputDir, srcFiles[i]);
            var srcFile = path.resolve(path.join(resourcePath, srcFiles[i]));

            wrench.mkdirSyncRecursive(path.dirname(dstFile));                              //создаем путь к файлу, если такого не существует
            fs.writeFileSync(dstFile, fs.readFileSync(srcFile));           //записываем файл в destFolder
        }
        

        var mapFile = path.join(outputDir, resourceName + ".map");

        fs.writeFileSync(mapFile, JSON.stringify(map, null, "\t"), "utf8");

        return path.relative(destFolder, mapFile).replace(/\\/ig, "/");
    }

    /**
     * @return {String} Путь к ресурсу.
     */
    function packResource(folder, Resource, dest) {
        var name = Resource.$.Name;

        for (var i = 0; i < Resource.PropertyGroup.length; ++i) {
            //TODO: проверить Condition данной групы и убедиться, что она подходит
            return crateResourceObject(name, folder, Resource.PropertyGroup[i], dest);
        }
    }

    /** 
     * Собиарем ресурсы по проекту
     * @param folder {String} Путь к папке с проектом.
     * @param Project {XML} Описание проекта в resources.xml.
     * @param dest {String} Файл, в который будет собран проект.
     */
    function buildProject(folder, Project, dest, cb) {
        console.time("Build project " + Project.$.Name);

        for (var i = 0; i < Project.Resource.length; ++i) {
            var resourcePath = packResource(folder, Project.Resource[i], path.dirname(dest));

            var data = fs.readFileSync(dest, "utf8");
            var pattern = /\{\s*\%([\w\d\.\-\_]*?)\%\s*\}/g;

            data = data.replace(pattern, function replacer(str, name) {
                if (name == Project.Resource[i].$.Name) {
                    return resourcePath;
                }

                return name;
            });

            fs.writeFileSync(dest, data, "utf8");
        }

        console.timeEnd("Build project " + Project.$.Name);

        cb(true);
    }

    //"{ %orientation_cube% }"

    /**
     * Ищем ресурсы для данного проектта.
     */
    function searchResources(moduleName, sourcePaths, dest, options, cb) {
        var srcFiles = [];
        var shortestPath = null;
        var resourceFolder = null;

        //normalize all pathes
        for (var i = 0; i < sourcePaths.length; ++i) {
            var srcFile = sourcePaths[i];

            srcFiles.push(path.resolve(path.dirname(srcFile)));
        }

        //sort > shortest path will be first
        srcFiles.sort(function (a, b) { return a.length < b.length ? -1 : 1 });

        resourceFolder = srcFiles[0];

        if (srcFiles.length > 1) {
            var dirs1 = srcFiles[0].split(path.sep);
            var dirs2 = srcFiles[1].split(path.sep);

            for (var i = 0; i < dirs1.length; ++i) {
                if (dirs1[i] != dirs2[i]) {
                    resourceFolder = dirs1.slice(0, i - 1).join(path.sep);
                }
            }
        }

        grunt.log.debug("Automaticly detected resource folder:", resourceFolder);

        var resourceFile = path.join(resourceFolder, "resources.xml");

        if (!fs.existsSync(resourceFile)) {
            grunt.log.warn("Could not find resoure.xml");
            return cb(true);
        }

        grunt.log.debug("Resources:", resourceFile);

        var parser = new xml2js.Parser();

        fs.readFile(resourceFile, function (err, data) {
            parser.parseString(data, function (err, xml) {
                for (var i = 0; i < xml.AkraResources.Project.length; ++i) {
                    var Project = xml.AkraResources.Project[i];

                    //проект найден
                    if (Project.$.Name === moduleName) {
                        return buildProject(resourceFolder, Project, dest, cb);
                    }
                }

                grunt.log.warn("Description of " + moduleName + " is not found in the resources.xml.");
                cb(true);
            });
        });
    }

    function minimize(src, level, cb) {
        if (!src || !grunt.file.exists(src)) {
            grunt.log.warn('Source file for minimize "' + src + '" not found.');
            return;
        }

        var dest = src.replace(/\.js$/, ".min.js");
        if (src === dest) dest += ".min";

        var closureJar = path.normalize(__dirname + '/closure/compiler.jar');
        var levelStr = level === 2 ? "ADVANCED_OPTIMIZATIONS" : "SIMPLE_OPTIMIZATIONS";
        var cmd = "java";
        var argv = ["-jar", closureJar,
                    "--compilation_level", levelStr,
                    "--js", src,
                    "--js_output_file", dest,
                    "--use_types_for_optimization",
                    "--externs", src + ".tmp.externs"
                    /*"--create_source_map", dest + ".map",
                    "--source_map_format=V3"*/];

        grunt.log.writeln(cmd + " " + argv.join(" "));

        var closure = spawn(cmd, argv);

        closure.stdout.on("data", function (data) {
            grunt.log.write(data.toString());
        });

        closure.stderr.on("data", function (data) {
            grunt.log.error(data.toString());
        });

        closure.on("close", function (code) {
            if (code === 0) {
                cb(true);
            }
            else {
                grunt.fail.warn("Closure minimization failed.");
                cb(false);
            }
        });
    }


    grunt.registerMultiTask("build", function () {
        var pendingFiles = this.files.length;

        if (pendingFiles > 0) {
            var opts = this.data,
                done = this.async();

            var moduleName = this.nameArgs.split(":")[1];

            if (!moduleName) {
                grunt.fail.fatal(new Error("Could not determ module name."));
            }

            grunt.log.debug("Current module: ", moduleName);

            this.files.forEach(function (file) {
                compile(moduleName, file.src, file.dest, opts.options, function (result) {
                    pendingFiles = pendingFiles - 1;
                    if (pendingFiles === 0) {
                        done(result);
                    }
                });
            });
        }
    });

};
