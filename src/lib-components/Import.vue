<template>
  <div>
    <input
      type="file"
      ref="file"
      style="display: none"
      v-on:change="fileSelected($event)"
    />
    <v-btn
      color="primary"
      v-bind="$attrs"
      v-on="$listeners"
      dark
      @click="$refs.file.click()"
      >Import</v-btn
    >
    <v-dialog
      v-model="openpreviewdialog"
      scrollable
      fullscreen
      persistent
      :overlay="false"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> Import Preview </v-card-title>
        <v-alert
          type="error"
          v-if="errors.length"
          v-for="(e, i) in errors"
          :key="i"
          dismissible
        >
          {{ e }}
        </v-alert>
        <v-card-text>
          <v-data-table
            v-if="filedata.data.length"
            :headers="datatableheaders"
            :items="filedata.data"
            :items-per-page="10"
            class="elevation-1"
          ></v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            @click="sendtoimport"
            :disabled="isImporting !== false"
            >{{ isImporting ? isImporting : "Import" }}</v-btn
          >
          <v-btn color="warning" @click="closedialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    options: [Object, Boolean],
  },
  data() {
    return {
      isImporting: false,
      errors: [],
      openpreviewdialog: false,
      datatableheaders: [],
      filedata: { data: [], meta: { fields: [] } },
    };
  },

  methods: {
    onComplete(results, file) {
      // Your logic here! functions or axios calls
      this.datatableheaders = [];
      this.filedata = results;
      for (let index = 0; index < this.filedata.meta.fields.length; index++) {
        const field = this.filedata.meta.fields[index];
        this.datatableheaders.push({ text: field, value: field });
      }
      this.openpreviewdialog = true;
    },

    fileSelected(e) {
      /* return first object in FileList */
      this.isImporting = false;
      var file = e.target.files[0];
      this.$papa.parse(file, {
        header: true,
        complete: this.onComplete, // your vue methods
      });
    },
    closedialog() {
      this.$refs.file.value = "";
      this.openpreviewdialog = false;
    },
    sendtoimport() {
      this.isImporting = "Importing...";
      var importdata = this.filedata.data;

      if (
        this.options.rowformatter &&
        typeof this.options.rowformatter === "function"
      ) {
        importdata = this.filedata.data.map((i) =>
          this.options.rowformatter(i)
        );
        console.log("importdata", importdata);
      }

      var endpoint = "/executeaction";
      var postVars = {
        action_to_execute: { execute: this.options.execute },
        importdata: importdata,
        model: this.options.model,
        transaction: this.options.transaction === "row" ? "row" : "file",
      };

      if (this.options.autoimport === true) {
        postVars.action_to_execute = {
          execute: "vnatk_autoimport",
          name: "vnatk_autoimport",
        };
      }

      this.options.service
        .post(
          (this.options.basepath ? this.options.basepath : "/vnatk") + endpoint,
          postVars
        )
        .then((response) => {
          if (typeof this.options.success === "function") {
            this.options.success(response.data);
          }
          this.$emit("import-finished", postVars, response.data);
          this.isImporting = false;
          this.closedialog();
        })
        .catch((error) => {
          if (
            this.options.errorhandler &&
            typeof this.options.errorhandler == "function"
          ) {
            let r = this.options.errorhandler(error);
            this.errors.push(r);
            console.log("Handed by errorhandler ", r);
            this.isImporting = false;
            return;
          }
          if (error.response) this.errors.push(error.response.data);
          else this.errors.push(error);
          this.isImporting = false;
        });
    },
  },
};
</script>